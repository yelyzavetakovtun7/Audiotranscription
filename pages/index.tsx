import { TranscriptionEditor } from '../src/components/TranscriptionEditor';

export default function Home() {
  return (
    <div>
      <TranscriptionEditor audioUrl="/sample-audio.mp3" />
    </div>
  );
} 