#!/usr/bin/env python3
"""
lonky.me 网站监控脚本
- 检测关键页面可用性和响应时间
- SSL 证书到期检测
- 关键功能检测（推特同步、API 等）
- 异常时推送 Telegram
"""

import requests
import ssl
import socket
import json
from datetime import datetime, timedelta
from pathlib import Path

# ===== 配置 =====
DOMAIN = "www.lonky.me"
BASE_URL = f"https://{DOMAIN}"

# 要监控的页面
PAGES = [
    {"path": "/", "name": "首页", "critical": True},
    {"path": "/podcast-notes/new", "name": "Podcast Notes", "critical": True},
]

# 关键数据文件检测
DATA_FILES = [
    {"path": "/data/latest-tweet.json", "name": "推特同步", "max_age_hours": 168},  # 7天，用户可能几天不发推
]

# 阈值
RESPONSE_TIME_WARN = 3.0  # 秒
RESPONSE_TIME_CRITICAL = 10.0
SSL_WARN_DAYS = 14

# 状态文件
STATE_FILE = Path(__file__).parent / "monitor-state.json"


def check_page(url: str, timeout: int = 15) -> dict:
    """检测页面可用性"""
    try:
        start = datetime.now()
        resp = requests.get(url, timeout=timeout, allow_redirects=True)
        elapsed = (datetime.now() - start).total_seconds()
        
        return {
            "ok": resp.status_code == 200,
            "status_code": resp.status_code,
            "response_time": round(elapsed, 2),
            "final_url": resp.url,
        }
    except requests.exceptions.Timeout:
        return {"ok": False, "error": "超时"}
    except requests.exceptions.ConnectionError:
        return {"ok": False, "error": "连接失败"}
    except Exception as e:
        return {"ok": False, "error": str(e)}


def check_ssl(domain: str) -> dict:
    """检测 SSL 证书"""
    try:
        import subprocess
        # 用 openssl 命令更可靠
        cmd = f"echo | openssl s_client -servername {domain} -connect {domain}:443 2>/dev/null | openssl x509 -noout -dates -issuer"
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=15)
        
        if result.returncode != 0:
            raise Exception("openssl 检测失败")
        
        output = result.stdout
        
        # 解析 notAfter=Feb 21 12:00:00 2026 GMT
        import re
        expire_match = re.search(r'notAfter=(.+)', output)
        if not expire_match:
            raise Exception("无法解析证书到期时间")
        
        expire_str = expire_match.group(1).strip()
        # 尝试多种格式
        for fmt in ['%b %d %H:%M:%S %Y %Z', '%b  %d %H:%M:%S %Y %Z']:
            try:
                expire_date = datetime.strptime(expire_str, fmt)
                break
            except:
                continue
        else:
            raise Exception(f"无法解析日期: {expire_str}")
        
        days_left = (expire_date - datetime.now()).days
        
        # 解析 issuer
        issuer_match = re.search(r'issuer=.*O\s*=\s*([^,/\n]+)', output)
        issuer = issuer_match.group(1).strip() if issuer_match else "Unknown"
        
        return {
            "ok": days_left > SSL_WARN_DAYS,
            "days_left": days_left,
            "expire_date": expire_date.strftime("%Y-%m-%d"),
            "issuer": issuer,
        }
    except Exception as e:
        return {"ok": False, "error": str(e)}


def check_data_freshness(path: str, max_age_hours: int) -> dict:
    """检测数据文件是否及时更新"""
    url = f"{BASE_URL}{path}"
    try:
        resp = requests.get(url, timeout=10)
        if resp.status_code != 200:
            return {"ok": False, "error": f"HTTP {resp.status_code}"}
        
        data = resp.json()
        
        # 尝试从数据中提取时间戳
        # 优先用 checked_at（同步检查时间），其次 updated_at（内容更新时间）
        timestamp = None
        for key in ['checked_at', 'updated_at', 'timestamp', 'created_at', 'date']:
            if key in data:
                timestamp = data[key]
                break
        
        if timestamp:
            try:
                # 尝试解析 ISO 格式
                if isinstance(timestamp, str):
                    update_time = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
                    age_hours = (datetime.now(update_time.tzinfo) - update_time).total_seconds() / 3600
                    
                    return {
                        "ok": age_hours <= max_age_hours,
                        "age_hours": round(age_hours, 1),
                        "last_update": timestamp,
                    }
            except:
                pass
        
        return {"ok": True, "note": "无法判断更新时间，但文件可访问"}
        
    except Exception as e:
        return {"ok": False, "error": str(e)}


def load_state() -> dict:
    """加载上次状态"""
    if STATE_FILE.exists():
        return json.loads(STATE_FILE.read_text())
    return {}


def save_state(state: dict):
    """保存状态"""
    STATE_FILE.write_text(json.dumps(state, indent=2, ensure_ascii=False))


def run_monitor() -> dict:
    """运行完整监控"""
    results = {
        "timestamp": datetime.now().isoformat(),
        "pages": [],
        "ssl": None,
        "data_files": [],
        "alerts": [],
    }
    
    # 1. 检测页面
    for page in PAGES:
        url = f"{BASE_URL}{page['path']}"
        check = check_page(url)
        check["name"] = page["name"]
        check["path"] = page["path"]
        check["critical"] = page.get("critical", False)
        results["pages"].append(check)
        
        if not check["ok"]:
            level = "🔴" if page.get("critical") else "🟡"
            err_msg = check.get('error') or f"HTTP {check.get('status_code')}"
            results["alerts"].append(f"{level} {page['name']} 不可访问: {err_msg}")
        elif check["response_time"] > RESPONSE_TIME_CRITICAL:
            results["alerts"].append(f"🔴 {page['name']} 响应极慢: {check['response_time']}s")
        elif check["response_time"] > RESPONSE_TIME_WARN:
            results["alerts"].append(f"🟡 {page['name']} 响应较慢: {check['response_time']}s")
    
    # 2. SSL 检测
    ssl_check = check_ssl(DOMAIN)
    results["ssl"] = ssl_check
    
    if not ssl_check["ok"]:
        if "error" in ssl_check:
            results["alerts"].append(f"🔴 SSL 检测失败: {ssl_check['error']}")
        else:
            results["alerts"].append(f"🟡 SSL 证书将在 {ssl_check['days_left']} 天后到期 ({ssl_check['expire_date']})")
    
    # 3. 数据文件检测
    for df in DATA_FILES:
        check = check_data_freshness(df["path"], df["max_age_hours"])
        check["name"] = df["name"]
        check["path"] = df["path"]
        results["data_files"].append(check)
        
        if not check["ok"]:
            if "error" in check:
                results["alerts"].append(f"🟡 {df['name']} 数据异常: {check['error']}")
            else:
                results["alerts"].append(f"🟡 {df['name']} 数据过期: {check.get('age_hours', '?')}h 未更新")
    
    return results


def format_report(results: dict, verbose: bool = False) -> str:
    """格式化监控报告"""
    lines = []
    
    if results["alerts"]:
        lines.append("⚠️ **lonky.me 监控告警**\n")
        for alert in results["alerts"]:
            lines.append(alert)
        lines.append("")
    
    if verbose or not results["alerts"]:
        lines.append(f"📊 **lonky.me 状态报告**")
        lines.append(f"🕐 {results['timestamp'][:19].replace('T', ' ')}\n")
        
        # 页面状态
        lines.append("**页面可用性:**")
        for p in results["pages"]:
            status = "✅" if p["ok"] else "❌"
            time_str = f" ({p['response_time']}s)" if p.get("response_time") else ""
            lines.append(f"  {status} {p['name']}{time_str}")
        
        # SSL
        ssl = results["ssl"]
        if ssl.get("ok"):
            lines.append(f"\n**SSL:** ✅ {ssl['days_left']}天有效 (到期 {ssl['expire_date']})")
        else:
            ssl_err = ssl.get('error') or f"{ssl.get('days_left')}天后到期"
            lines.append(f"\n**SSL:** ❌ {ssl_err}")
        
        # 数据文件
        if results["data_files"]:
            lines.append("\n**数据同步:**")
            for df in results["data_files"]:
                status = "✅" if df["ok"] else "⚠️"
                extra = f" ({df.get('age_hours', '?')}h前)" if df.get("age_hours") else ""
                lines.append(f"  {status} {df['name']}{extra}")
    
    return "\n".join(lines)


if __name__ == "__main__":
    import sys
    
    verbose = "--verbose" in sys.argv or "-v" in sys.argv
    json_output = "--json" in sys.argv
    
    results = run_monitor()
    
    if json_output:
        print(json.dumps(results, indent=2, ensure_ascii=False))
    else:
        report = format_report(results, verbose=verbose)
        print(report)
    
    # 有告警时返回非零状态码
    sys.exit(1 if results["alerts"] else 0)
