#!/usr/bin/env python3
"""Prevent blank Android WebView: verify all bundled entrypoint URLs resolve locally."""
import argparse
import re
import sys
import zipfile
from pathlib import Path

parser=argparse.ArgumentParser()
parser.add_argument("apk",type=Path)
parser.add_argument("--version",default="3.2.1")
args=parser.parse_args()
with zipfile.ZipFile(args.apk) as apk:
    names=set(apk.namelist())
    entry="assets/public/index.html"
    assert entry in names, f"missing {entry}"
    html=apk.read(entry).decode("utf-8")
    assert args.version in html, f"index.html does not mention {args.version}"
    assert "/moy-mir-adventure-preview/" not in html, "WRONG VITE BASE: bundled HTML points to GitHub Pages, not local WebView assets"
    assets=re.findall(r"""(?:src|href)=["'](/[^"']+)["']""",html)
    assert len(assets)>=2, f"expected script and CSS assets, got {assets}"
    for u in assets:
        name=f"assets/public{u.split('?')[0]}"
        assert name in names, f"WebView will fail: {u} is not inside APK ({name})"
        assert apk.getinfo(name).file_size>200, f"empty asset {name}"
    assert any(n.endswith("classes.dex") for n in names), "missing Android native code"
    assert any(n.endswith("miro_alarm_greeting.mp3") for n in names), "missing Miro audio"
    print(f"PASS Android WebView entrypoint {args.version}; {len(assets)} local assets exist: {assets}")
