# -*- coding: utf-8 -*-
import io, re
for f in ['PRD-提成设置.html', 'PRD-提成设置-开发版.html']:
    h = io.open(f, encoding='utf-8').read()
    print(f, '| h1', len(re.findall(r'<h1', h)), '| h2', len(re.findall(r'<h2', h)),
          '| h3', len(re.findall(r'<h3', h)), '| table', len(re.findall(r'<table', h)),
          '| pre', len(re.findall(r'<pre>', h)), '| mermaid', h.count('class="mermaid"'),
          '| hint-item__t', h.count('comm2-hint-item__t'))
    print('   title :', re.search(r'<title>(.*?)</title>', h).group(1))
    print('   topbar:', re.sub(r'<.*?>', '', re.search(r'<div class="topbar__title">(.*?)</div>', h).group(1))[:60])
    print('   dl    :', re.findall(r'href="(PRD-[^"]+\.md)"', h)[:2])
