"""Render the real browser captures in artifacts/video/clips.json into a 120s MP4.

Requires Python, imageio-ffmpeg and a downloaded Cipher2.mp3 in artifacts/video/music.
Run from the repository root: python scripts/render-showcase.py
The browser screenshots are actual project frames, not generated mockups.
"""
import concurrent.futures
import json
from pathlib import Path
import subprocess
import sys

import imageio_ffmpeg

ROOT = Path(__file__).resolve().parent.parent
WORK = ROOT / 'artifacts/video'
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
CLIPS = json.loads((WORK / 'clips.json').read_text(encoding='utf-8'))
assert sum(c['duration'] for c in CLIPS) == 120
(WORK / 'render').mkdir(exist_ok=True)


def ass_time(seconds):
    cs = round(seconds * 100)
    return f'{cs//360000}:{cs//6000%60:02}:{cs//100%60:02}.{cs%100:02}'


def subtitles(clip, index):
    header = '''[Script Info]
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080
ScaledBorderAndShadow: yes
WrapStyle: 2
[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Title,Microsoft YaHei,27,&H00E4F5EF,&H00FFFFFF,&H00201B0D,&H00000000,1,0,0,0,100,100,0,0,1,0,0,7,0,0,0,1
Style: Detail,Microsoft YaHei,20,&H00B9C7C5,&H00FFFFFF,&H00201B0D,&H00000000,0,0,0,0,100,100,0,0,1,0,0,7,0,0,0,1
[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
'''
    end = ass_time(clip['duration'])
    lines = [
        f'Dialogue: 0,0:00:00.00,{end},Title,,0,0,0,,{{\\pos(98,1005)\\fad(180,100)}}{clip["title"]}',
        f'Dialogue: 0,0:00:00.00,{end},Detail,,0,0,0,,{{\\pos(98,1043)\\fad(180,100)}}{clip["subtitle"]}',
        f'Dialogue: 0,0:00:00.00,{end},Title,,0,0,0,,{{\\an9\\pos(1820,1006)\\fs22\\c&HABD978&}}{index+1:02} / {len(CLIPS):02}',
    ]
    if index == 0:
        lines.append('Dialogue: 1,0:00:00.30,0:00:03.60,Title,,0,0,0,,{\\an5\\pos(960,420)\\fs68\\bord2\\shad3\\fad(600,500)}未来院区 · 数字孪生')
        lines.append('Dialogue: 1,0:00:00.50,0:00:03.60,Detail,,0,0,0,,{\\an5\\pos(960,505)\\fs30\\bord1\\shad2\\fad(600,500)}空间管理 / 车流与通勤 / 运营感知')
    if index == len(CLIPS) - 1:
        lines.append(f'Dialogue: 1,0:00:07.00,{end},Title,,0,0,0,,{{\\an5\\pos(960,440)\\fs70\\bord2\\shad3\\fad(600,700)}}未来院区')
        lines.append(f'Dialogue: 1,0:00:07.20,{end},Detail,,0,0,0,,{{\\an5\\pos(960,526)\\fs30\\bord1\\shad2\\fad(600,700)}}让每一处空间，实时可感知')
        lines.append(f'Dialogue: 1,0:00:04.00,{end},Detail,,0,0,0,,{{\\an3\\pos(1820,1076)\\fs15}}Music: Cipher - Kevin MacLeod / incompetech.com / CC BY 4.0')
    return header + '\n'.join(lines) + '\n'


def render_clip(pair):
    index, clip = pair
    name = clip['id']
    output = WORK / 'render' / f'{name}.mp4'
    # Reuse an already completed first pass when only the final credit changes.
    if '--reuse-existing' in sys.argv and output.is_file() and index < len(CLIPS)-1:
        return output
    concat = WORK / 'render' / f'{name}.ffconcat'
    entries = ['ffconcat version 1.0']
    for i, sample in enumerate(clip['samples']):
        following = clip['samples'][i+1]['time'] if i+1 < len(clip['samples']) else clip['duration']
        duration = max(.001, following - sample['time'])
        path = Path(sample['path']).as_posix()
        assert Path(path).is_file(), path
        entries.extend([f"file '{path}'", f'duration {duration:.6f}'])
    entries.append(f"file '{Path(clip['samples'][-1]['path']).as_posix()}'")
    concat.write_text('\n'.join(entries), encoding='utf-8')
    (WORK / 'render' / f'{name}.ass').write_text(subtitles(clip, index), encoding='utf-8-sig')
    output = WORK / 'render' / f'{name}.mp4'
    # Interpolate motion only in the actual 3D viewport. Keep dashboard text sharp.
    prefix = ('[0:v]tpad=stop_mode=clone:stop_duration=0.5,split[base][motion];'
              '[base]fps=30[base30];'
              '[motion]crop=732:260:242:278,'
              'minterpolate=fps=30:mi_mode=mci:mc_mode=obmc:me_mode=bilat:me=epzs:mb_size=16:search_param=8[motion30];'
              '[base30][motion30]overlay=242:278:shortest=1,')
    if name in ['09-assets', '11-energy']:
        prefix = '[0:v]tpad=stop_mode=clone:stop_duration=0.5,fps=30,'
    filters = prefix + (
        'scale=1728:972:flags=lanczos,pad=1920:1080:96:18:color=0x0d1b26,'
        f'subtitles=render/{name}.ass,'
        'fade=t=in:d=0.15,'
        f'fade=t=out:st={clip["duration"]-.15}:d=0.15[video]'
    )
    command = [FFMPEG, '-hide_banner', '-y', '-filter_complex_threads', '2', '-f', 'concat', '-safe', '0', '-i', str(concat),
               '-filter_complex', filters, '-map', '[video]', '-frames:v', str(clip['duration']*30), '-an', '-c:v', 'libx264', '-threads', '2',
               '-preset', 'fast', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', '30', '-movflags', '+faststart', str(output)]
    with (WORK / 'render' / f'{name}.log').open('w', encoding='utf-8') as log:
        subprocess.run(command, cwd=WORK, stdout=log, stderr=log, check=True)
    print(f'Rendered {name}: {clip["duration"]}s', flush=True)
    return output


with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
    rendered = list(pool.map(render_clip, enumerate(CLIPS)))
join_file = WORK / 'render/join.ffconcat'
join_file.write_text('ffconcat version 1.0\n' + '\n'.join(f"file '{p.as_posix()}'" for p in rendered), encoding='utf-8')
music = WORK / 'music/Cipher2.mp3'
if not music.is_file():
    raise FileNotFoundError('Music has not been downloaded: ' + str(music))
output = WORK / '未来院区-项目展示-2分钟.mp4'
command = [FFMPEG, '-hide_banner', '-y', '-f', 'concat', '-safe', '0', '-i', str(join_file), '-i', str(music),
           '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000',
           '-af', 'atrim=0:120,asetpts=PTS-STARTPTS,loudnorm=I=-18:TP=-1.5:LRA=9,afade=t=in:d=2,afade=t=out:st=116:d=4',
           '-t', '120', '-movflags', '+faststart', '-metadata', 'title=未来院区 · 数字孪生项目展示',
           '-metadata', 'comment=Music: Cipher by Kevin MacLeod (incompetech.com). CC BY 4.0. https://creativecommons.org/licenses/by/4.0/ . Excerpt, fades and loudness adjustment.', str(output)]
with (WORK / 'render/final.log').open('w', encoding='utf-8') as log:
    subprocess.run(command, cwd=WORK, stdout=log, stderr=log, check=True)
print(f'FINAL: {output} ({output.stat().st_size} bytes)', flush=True)
