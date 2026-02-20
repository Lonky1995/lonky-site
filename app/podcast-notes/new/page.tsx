import { PodcastCreator } from "@/components/podcast/PodcastCreator";

export const metadata = {
  title: "New Podcast Note",
  description: "Create a new AI-powered podcast note",
};

export default function NewPodcastNotePage() {
  return (
    <div className="min-h-screen px-6 py-20 md:px-8">
      <div className="mx-auto max-w-3xl">
        <PodcastCreator />
      </div>
    </div>
  );
}
