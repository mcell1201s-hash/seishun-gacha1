"""Optional art source. Run from the repository root; no dependency or game build needed."""
from pathlib import Path
OUT = Path(__file__).resolve().parents[1] / 'assets' / 'pixel'
OUT.mkdir(parents=True, exist_ok=True)

class Canvas:
    def __init__(self, width, height):
        self.w, self.h, self.parts = width, height, []
    def rect(self, x, y, w, h, color):
        self.parts.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{color}"/>')
    def save(self, name):
        (OUT / f'{name}.svg').write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {self.w} {self.h}" shape-rendering="crispEdges">'+''.join(self.parts)+'</svg>\n')

navy, cream, blue, green, pink, gold = '#293954', '#fff1d2', '#5186bd', '#609376', '#e68da5', '#e8b65d'
# Low resolution, rect-only scenery; every tile and character is original.
for season in ['spring','summer','autumn','winter']:
    c=Canvas(320,180)
    sky={'spring':'#a9d3d4','summer':'#79b9dc','autumn':'#e8ac8b','winter':'#bccdda'}[season]
    ground={'spring':'#9cb980','summer':'#7ca36d','autumn':'#b99a6e','winter':'#dce2da'}[season]
    foliage={'spring':'#eaa8b4','summer':'#609b72','autumn':'#bd7058','winter':'#e6eeeb'}[season]
    c.rect(0,0,320,180,sky);c.rect(0,125,320,55,ground)
    c.rect(246,20,16,16,'#fff0c0');c.rect(242,24,24,8,'#fff0c0')
    for x,y in [(18,22),(93,12),(177,34)]:
        c.rect(x,y,34,6,'#eaf0df');c.rect(x+7,y-5,20,5,'#eaf0df');c.rect(x+24,y+6,18,4,'#eaf0df')
    # Distant hills and hedge.
    for x,y,w in [(0,91,60),(46,83,60),(240,86,80)]:c.rect(x,y,w,42,'#839f94')
    c.rect(0,120,320,8,'#5d8275')
    # School, roof, clock tower, balconies, windows.
    c.rect(65,57,188,73,'#d0c9ac');c.rect(61,53,196,7,navy)
    c.rect(132,36,49,22,'#e2d9b8');c.rect(128,32,57,6,navy)
    c.rect(150,39,14,14,cream);c.rect(156,41,2,7,navy);c.rect(156,47,5,2,navy)
    for y in [65,88,110]:
        for x in range(75,246,22):
            c.rect(x,y,14,14,'#526e80');c.rect(x+2,y+2,4,10,'#a2cbd0');c.rect(x+8,y+2,4,10,'#88afb9')
        c.rect(64,y+16,190,3,'#b2ad94')
    c.rect(144,110,31,20,'#516577');c.rect(159,111,2,19,'#d6c9ab')
    c.rect(133,130,53,5,'#b4aa94');c.rect(121,135,77,5,'#d6c7a7')
    c.rect(140,140,40,40,'#d9c9a5')
    # Framing trees and scattered seasonal detail.
    for x,y in [(23,66),(277,78)]:
        c.rect(x+8,y+20,7,63,'#866f5c');c.rect(x+3,y+38,8,5,'#866f5c')
        for dx,dy,w,h in [(-11,9,42,28),(-4,0,30,12),(-16,20,53,16),(-7,34,36,9)]:c.rect(x+dx,y+dy,w,h,foliage)
        highlight={'spring':'#f3c6c7','summer':'#86af7c','autumn':'#e7a06b','winter':'#f6f3e6'}[season]
        for dx,dy in [(-7,17),(7,5),(20,25)]:c.rect(x+dx,y+dy,9,6,highlight)
    for x,y in [(12,148),(78,158),(222,151),(294,166),(42,134)]:
        c.rect(x,y,3,3,foliage)
    # Tiny students and sports court.
    c.rect(205,145,62,1,cream);c.rect(205,145,1,26,cream);c.rect(267,145,1,26,cream);c.rect(205,170,63,1,cream)
    for x,y in [(199,132),(237,151),(91,143)]:
        c.rect(x+1,y,4,4,'#e0bc94');c.rect(x,y-1,6,2,navy);c.rect(x,y+4,6,7,blue);c.rect(x,y+11,2,5,navy);c.rect(x+4,y+11,2,5,navy)
    if season=='winter':
        c.rect(63,52,192,3,'#f8f5eb')
        for x,y in [(20,43),(115,30),(208,65),(295,36),(57,111),(194,103)]:c.rect(x,y,2,2,cream)
    c.save('school-'+season)

# Club-specific tournament stages.
for club in ['baseball','band','art']:
    c=Canvas(320,100)
    c.rect(0,0,320,100, {'baseball':'#a7d1dc','band':'#514865','art':'#d3c4a5'}[club])
    if club=='baseball':
        c.rect(0,57,320,43,'#80a17a');c.rect(30,57,260,4,'#f7e5b3');c.rect(30,37,260,20,'#5a8276')
        for x in range(36,290,16):c.rect(x,41,7,7,'#8cb3a0')
        c.rect(108,67,104,30,'#c2a27c');c.rect(155,63,10,5,cream);c.rect(150,89,20,3,cream)
        c.rect(235,15,55,32,navy);c.rect(241,21,43,4,gold);c.rect(246,32,6,6,cream);c.rect(272,32,6,6,cream)
    elif club=='band':
        c.rect(0,0,34,85,'#9b596c');c.rect(286,0,34,85,'#9b596c');c.rect(0,0,320,12,'#9b596c');c.rect(29,12,6,66,'#c27b80');c.rect(285,12,6,66,'#c27b80')
        c.rect(25,78,270,22,'#ab906f')
        for x in range(76,260,42):
            c.rect(x,51,10,11,'#e4c49c');c.rect(x-3,62,16,17,navy);c.rect(x+12,63,13,5,gold);c.rect(x+23,59,5,13,gold)
            c.rect(x+1,24,2,16,cream);c.rect(x-4,36,5,4,cream)
    else:
        c.rect(0,75,320,25,'#af937b');c.rect(15,13,290,5,'#b5a07f')
        for x in [35,125,215]:
            c.rect(x-4,30,72,42,'#8a7054');c.rect(x,34,64,34,cream);c.rect(x+9,43,15,13,blue);c.rect(x+30,37,24,19,green);c.rect(x+22,52,31,11,pink)
            c.rect(x+21,72,19,4,'#ede2c0')
    c.save('stage-'+club)

# 16px original icon sprites: rows are pixels, dots are transparent.
patterns={
'baseball': ['................','......wwww......','....wwwwwwww....','...wwrwwwwrww...','..wwrwwwwwwrww..','..wrwwwwwwwwrw..','.wwrwwwwwwwwrww.','.wwrwwwwwwwwrww.','.wwrwwwwwwwwrww.','.wwrwwwwwwwwrww.','..wrwwwwwwwwrw..','..wwrwwwwwwrww..','...wwrwwwwrww...','....wwwwwwww....','......wwww......','................'],
'band':['................','.........gg.....','........gggg....','.........gg.....','.......gg.......','......gg........','.....gg.........','....gggg........','....ggggg.......','.....ggggg......','......ggggg.....','.....ggggg......','...gggggg.......','..gggggg........','...gggg.........','................'],
'art':['................','....gggggg......','..gggggggggg....','.ggbgggggrggg...','.gbbbgggrrrggg..','gggbgggggrgggg..','gggggggggggggg..','gggrgggggbgggg..','ggrrrgggbbbggg..','gggrgggggbggg...','.ggggggggggg....','..ggggggggg.....','....gggggg......','.........nn.....','..........nn....','................'],
'fire':['................','........r.......','.......rr.......','......rrr.......','.....rrrr.r.....','....rrrrrrr.....','...rrrrrrrrr....','...rrrrgrrrr....','..rrrrggrrrrr...','..rrrggggrrrr...','..rrggggggrrr...','...rggwgggrr....','...rggwwggrr....','....ggwwgg......','.....gggg.......','................'],
'rest':['................','.....bbbbbb.....','....bbbbbbbb....','....bbwwwwbb....','....bbbbbbbb....','.....bbbbbb.....','..nnnnnnnnnnnn..','..nwwwnnnnnnnn..','..nwwwbbbbbbbn..','..nbbbbbbbbbbn..','..nnnnnnnnnnnn..','..n..........n..','..n..........n..','................','................','................'],
'social':['................','..nnnnnnnnnn....','.nwwwwwwwwwwn...','.nwwwwwwwwwwn...','.nwwnwwnwwnwn...','.nwwwwwwwwwwn...','.nwwwwwwwwwwn...','..nnnwwnnnnn....','.....wn.........','....wn....pppp..','..........pwwp..','........pppwwpp.','........pwwwwwp.','........ppppppp.','................','................'],
'heart':['................','...ppp...ppp....','..ppppp.ppppp...','.ppppppppppppp..','.ppwpppppppppp..','.ppwpppppppppp..','..ppppppppppp...','...ppppppppp....','....ppppppp.....','.....ppppp......','......ppp.......','.......p........','................','................','................','................'],
'team':['................','..nnn.....nnn...','..nss.....ssn...','..sss.....sss...','..bbb.....bbb...','.bbbbb...bbbbb..','..bbb.....bbb...','......nnn.......','......sss.......','......sss.......','......bbb.......','.....bbbbb......','......bbb.......','......n.n.......','.....nn.nn......','................'],
'lock':['................','.....nnnnnn.....','....nn....nn....','....n......n....','....n......n....','...nnnnnnnnnn...','...nggggggggn...','...ngggnngggn...','...ngggnngggn...','...ngggnngggn...','...nggggggggn...','...nnnnnnnnnn...','................','................','................','................'],
'trophy':['................','....gggggggg....','..gggggggggggg..','..g.gggggggg.g..','..g.gggggggg.g..','..gggggggggggg..','....gggggggg....','.....gggggg.....','......gggg......','.......gg.......','.......gg.......','......gggg......','.....gggggg.....','....nnnnnnnn....','................','................'],
'cap':['................','.......nn.......','.....nnnnnn.....','...nnnnnnnnnn...','.nnnnnnnnnnnnnn.','...nnnnnnnnnn.g.','.....nnnnnn...g.','....ssssssss..g.','....ssnssnss....','....ssssssss....','.....ssssss.....','......nnnn......','....nnwwwwnn....','...nnnwwwwnnn...','................','................']}
palette={'n':navy,'w':cream,'b':blue,'g':gold,'r':'#cc715f','p':pink,'s':'#e6bc94'}
for name,rows in patterns.items():
    c=Canvas(16,16)
    for y,row in enumerate(rows):
        for x,char in enumerate(row):
            if char!='.':c.rect(x,y,1,1,palette[char])
    c.save(name)

# Three recognizable faces, a coach, and a schoolboy runner.
for name,hair,style in [('support','#634c4b','long'),('diligent','#e8ba67','bob'),('free','#6e6896','short'),('coach','#666b6e','coach')]:
    c=Canvas(24,24);c.rect(1,1,22,22,'#f4dfb8');c.rect(5,4,14,14,hair);c.rect(3,7,18,10,hair)
    c.rect(6,8,12,11,'#edc59f');c.rect(5,10,1,5,'#e2b38f');c.rect(18,10,1,5,'#e2b38f')
    c.rect(6,5,12,4,hair);c.rect(6,8,4,2,hair);c.rect(17,8,2,4,hair)
    if style=='long':c.rect(4,11,2,10,hair);c.rect(18,11,2,10,hair);c.rect(4,8,3,2,pink)
    if style=='bob':c.rect(4,9,2,8,hair);c.rect(18,9,2,8,hair);c.rect(5,17,3,1,hair);c.rect(16,17,3,1,hair);c.rect(7,5,7,1,'#f7da8b')
    if style=='short':c.rect(5,7,3,5,hair);c.rect(8,5,3,5,hair);c.rect(16,6,3,4,hair)
    c.rect(8,12,2,2,navy);c.rect(14,12,2,2,navy);c.rect(11,16,3,1,'#b96f6c')
    if style!='coach':c.rect(7,15,2,1,pink);c.rect(15,15,2,1,pink)
    c.rect(6,20,12,4,green if style=='coach' else blue);c.rect(10,20,4,3,cream)
    if style=='coach':c.rect(4,5,16,4,navy);c.rect(3,8,18,2,navy);c.rect(7,12,4,3,navy);c.rect(13,12,4,3,navy)
    else:c.rect(11,21,2,2,pink if name=='support' else green)
    c.save('face-'+name)
c=Canvas(20,26)
for rect in [(9,1,7,3,navy),(8,4,8,6,'#e6bc94'),(8,3,3,3,navy),(11,6,1,1,navy),(6,10,8,9,blue),(9,10,4,3,cream),(3,12,4,3,'#e6bc94'),(13,13,5,3,'#e6bc94'),(7,18,5,4,navy),(3,21,5,3,navy),(1,23,5,2,navy),(12,18,4,3,navy),(14,20,4,3,navy),(15,23,5,2,navy)]:c.rect(*rect)
c.save('runner')
print(f'Wrote {len(list(OUT.glob("*.svg")))} original SVG pixel assets')
