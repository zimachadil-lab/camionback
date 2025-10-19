import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VoiceRecorderProps {
  onVoiceRecorded: (audioBlob: Blob) => void;
  disabled?: boolean;
}

export function VoiceRecorder({ onVoiceRecorded, disabled }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const MAX_RECORDING_TIME = 60; // 60 seconds (1 minute)

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType });
        console.log('Voice recording completed:', {
          size: audioBlob.size,
          type: audioBlob.type,
          chunks: chunksRef.current.length
        });
        
        if (audioBlob.size === 0) {
          toast({
            variant: "destructive",
            title: "Erreur",
            description: "L'enregistrement est vide",
          });
          setIsProcessing(false);
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        
        onVoiceRecorded(audioBlob);
        
        // Stop all audio tracks
        stream.getTracks().forEach(track => track.stop());
        setIsProcessing(false);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prevTime) => {
          const newTime = prevTime + 1;
          if (newTime >= MAX_RECORDING_TIME) {
            stopRecording();
            toast({
              title: "Limite atteinte",
              description: "Durée maximale d'enregistrement: 1 minute",
            });
          }
          return newTime;
        });
      }, 1000);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible d'accéder au microphone",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      setIsProcessing(true);
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isRecording) {
    return (
      <div className="flex items-center gap-2">
        <Button
          onClick={stopRecording}
          size="icon"
          variant="destructive"
          data-testid="button-stop-recording"
        >
          <Square className="h-4 w-4" />
        </Button>
        <span className="text-sm text-muted-foreground">
          {formatTime(recordingTime)} / {formatTime(MAX_RECORDING_TIME)}
        </span>
      </div>
    );
  }

  if (isProcessing) {
    return (
      <Button size="icon" disabled>
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    );
  }

  return (
    <Button
      onClick={startRecording}
      size="icon"
      variant="outline"
      disabled={disabled}
      data-testid="button-start-recording"
    >
      <Mic className="h-4 w-4" />
    </Button>
  );
}
