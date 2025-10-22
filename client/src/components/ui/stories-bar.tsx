import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Circle, Play } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface Story {
  id: string;
  title: string;
  content: string;
  mediaUrl: string | null;
  role: string;
  order: number;
  isActive: boolean;
  createdAt: Date | null;
}

interface StoriesBarProps {
  userRole: "client" | "transporter";
}

export function StoriesBar({ userRole }: StoriesBarProps) {
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const { data: stories = [] } = useQuery<Story[]>({
    queryKey: ["/api/stories/active", userRole],
    queryFn: async () => {
      const res = await fetch(`/api/stories/active?role=${userRole}`);
      if (!res.ok) throw new Error("Failed to fetch stories");
      return res.json();
    },
  });

  const handleStoryClick = (story: Story, index: number) => {
    setSelectedStory(story);
    setCurrentIndex(index);
  };

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedStory(stories[currentIndex + 1]);
    } else {
      setSelectedStory(null);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setSelectedStory(stories[currentIndex - 1]);
    }
  };

  if (!stories || stories.length === 0) {
    return null;
  }

  return (
    <>
      <div className="w-full bg-card border-b">
        <div className="overflow-x-auto">
          <div className="flex gap-3 p-3 min-w-min">
            {stories.map((story, index) => (
              <button
                key={story.id}
                onClick={() => handleStoryClick(story, index)}
                className="flex flex-col items-center gap-2 flex-shrink-0 hover-elevate active-elevate-2 rounded-lg p-2"
                data-testid={`button-story-${index}`}
              >
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-primary via-accent to-primary p-0.5">
                    <div className="w-full h-full rounded-full bg-card flex items-center justify-center">
                      {story.mediaUrl ? (
                        <img
                          src={story.mediaUrl}
                          alt={story.title}
                          className="w-14 h-14 rounded-full object-cover"
                        />
                      ) : (
                        <Circle className="w-8 h-8 text-primary" />
                      )}
                    </div>
                  </div>
                  <div className="absolute bottom-0 right-0 w-5 h-5 bg-primary rounded-full flex items-center justify-center border-2 border-card">
                    <Play className="w-3 h-3 text-primary-foreground fill-current" />
                  </div>
                </div>
                <span className="text-xs font-medium text-foreground max-w-[70px] truncate">
                  {story.title}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <Dialog open={!!selectedStory} onOpenChange={() => setSelectedStory(null)}>
        <DialogContent className="max-w-md h-[80vh] p-0 bg-black/95 border-none">
          {selectedStory && (
            <div className="relative h-full flex flex-col">
              {/* Progress indicators */}
              <div className="absolute top-0 left-0 right-0 flex gap-1 p-3 z-10">
                {stories.map((_, index) => (
                  <div
                    key={index}
                    className={`h-1 flex-1 rounded-full ${
                      index === currentIndex
                        ? "bg-white"
                        : index < currentIndex
                        ? "bg-white/70"
                        : "bg-white/30"
                    }`}
                  />
                ))}
              </div>

              {/* Story header */}
              <div className="absolute top-10 left-0 right-0 p-4 z-10">
                <h3 className="text-white text-lg font-bold">{selectedStory.title}</h3>
              </div>

              {/* Story media/content */}
              <div className="flex-1 flex items-center justify-center p-4">
                {selectedStory.mediaUrl ? (
                  <img
                    src={selectedStory.mediaUrl}
                    alt={selectedStory.title}
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <div className="text-center px-6">
                    <p className="text-white text-base leading-relaxed whitespace-pre-wrap">
                      {selectedStory.content}
                    </p>
                  </div>
                )}
              </div>

              {/* Story text (if media is present) */}
              {selectedStory.mediaUrl && selectedStory.content && (
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                  <p className="text-white text-sm leading-relaxed">
                    {selectedStory.content}
                  </p>
                </div>
              )}

              {/* Navigation areas */}
              <button
                onClick={handlePrevious}
                className="absolute left-0 top-0 bottom-0 w-1/3 cursor-pointer"
                aria-label="Story précédente"
                disabled={currentIndex === 0}
                data-testid="button-story-previous"
              />
              <button
                onClick={handleNext}
                className="absolute right-0 top-0 bottom-0 w-2/3 cursor-pointer"
                aria-label="Story suivante"
                data-testid="button-story-next"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
