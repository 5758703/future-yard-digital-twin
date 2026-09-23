"""Optional runner using the locally installed PyPI Blender runtime.

python -m pip install bpy --target .blender-runtime
python blender/run_with_bpy.py
"""
import runpy
import sys
from pathlib import Path

root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root / '.blender-runtime'))
runpy.run_path(str(root / 'blender/generate_campus.py'), run_name='__main__')
