"""Inspect existing lesson audio locally; keep transcripts outside public/."""
import argparse
import json
import subprocess
from pathlib import Path

from faster_whisper import WhisperModel


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--model', default='small')
    parser.add_argument('--output', default='output/ui-qa/media-review')
    arguments = parser.parse_args()
    root = Path(__file__).resolve().parent.parent
    output = root / arguments.output
    output.mkdir(parents=True, exist_ok=True)
    videos = sorted((root / 'public/assets/video-lessons').glob('*.mp4'))
    model = WhisperModel(arguments.model, device='cpu', compute_type='int8', cpu_threads=4)
    records = []
    for video in videos:
        metadata = json.loads(subprocess.run([
            'ffprobe', '-v', 'error', '-show_entries',
            'format=duration,size:stream=index,codec_type,codec_name,sample_rate,channels,width,height',
            '-of', 'json', str(video),
        ], capture_output=True, text=True, check=True).stdout)
        audio = output / f'{video.stem}.wav'
        if not audio.exists():
            subprocess.run(['ffmpeg', '-v', 'error', '-i', str(video), '-vn', '-ac', '1', '-ar', '16000', str(audio)], check=True)
        segments, info = model.transcribe(str(audio), language='pt', beam_size=5, vad_filter=True, condition_on_previous_text=False, word_timestamps=True)
        transcript = [
            {'start': segment.start, 'end': segment.end, 'text': segment.text.strip(),
             'avg_logprob': segment.avg_logprob, 'no_speech_prob': segment.no_speech_prob,
             'words': [{'start': word.start, 'end': word.end, 'word': word.word, 'probability': word.probability} for word in segment.words or []]}
            for segment in segments
        ]
        record = {'file': str(video.relative_to(root)), 'metadata': metadata, 'model': arguments.model,
                  'language': info.language, 'speech_duration': info.duration_after_vad,
                  'segments': transcript, 'reviewed': False}
        destination = output / f'{video.stem}.json'
        destination.write_text(json.dumps(record, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        records.append(record)
        with (output / 'cases.jsonl').open('a', encoding='utf-8') as progress:
            progress.write(json.dumps(record, ensure_ascii=False) + '\n')
        print(json.dumps(record, ensure_ascii=False), flush=True)
    assert len({record['file'] for record in records}) == len(videos) == 3
    (output / 'media.json').write_text(json.dumps({'expected': len(videos), 'completed': len(records), 'results': records}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


if __name__ == '__main__':
    main()
