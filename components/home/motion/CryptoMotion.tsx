"use client";
import { Player } from "@remotion/player";
import { useCurrentFrame, interpolate } from "remotion";
function Network() {
  const frame = useCurrentFrame();
  const offset = interpolate(frame, [0, 45], [1500, 0], {
    extrapolateRight: "clamp",
  });
  return (
    <svg viewBox="0 0 520 380">
      <g
        className="network-paths"
        style={{ strokeDashoffset: offset, animation: "none" }}
        fill="none"
        stroke="#75816b"
        strokeWidth="1"
      >
        <circle cx="260" cy="190" r="125"></circle>
        <ellipse
          cx="260"
          cy="190"
          rx="210"
          ry="65"
          transform="rotate(-28 260 190)"
        ></ellipse>
        <ellipse
          cx="260"
          cy="190"
          rx="210"
          ry="65"
          transform="rotate(28 260 190)"
        ></ellipse>
        <path d="M90 80L260 190L430 80M90 300L260 190L430 300"></path>
      </g>
      <g fill="#dfe3d8" stroke="#75816b">
        <circle cx="260" cy="190" r="43"></circle>
        <circle cx="90" cy="80" r="7"></circle>
        <circle cx="430" cy="80" r="7"></circle>
        <circle cx="90" cy="300" r="7"></circle>
        <circle cx="430" cy="300" r="7"></circle>
      </g>
      <g
        fill="#293326"
        textAnchor="middle"
        fontFamily="Helvetica Neue, sans-serif"
        fontSize="13"
      >
        <text x="260" y="195">
          {"CRYPTO"}
        </text>
        <text x="90" y="57">
          {"市场观察"}
        </text>
        <text x="430" y="57">
          {"信息摘要"}
        </text>
        <text x="90" y="330">
          {"研究工具"}
        </text>
        <text x="430" y="330">
          {"独立判断"}
        </text>
      </g>
    </svg>
  );
}
export default function CryptoMotion() {
  return (
    <Player
      component={Network}
      durationInFrames={60}
      fps={30}
      compositionWidth={520}
      compositionHeight={380}
      autoPlay
      controls={false}
      clickToPlay={false}
      moveToBeginningWhenEnded={false}
      numberOfSharedAudioTags={0}
      style={{ width: "100%", height: "100%", pointerEvents: "none" }}
    />
  );
}
