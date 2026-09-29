import re

with open('index.html', 'r') as f:
    html = f.read()

minimal_hero = """            <div class="hero-section" style="background: transparent; border: none; box-shadow: none; padding: 40px 20px 20px 20px; text-align: left; max-width: 1000px; margin: 0 auto;">
                <h1 style="font-family: 'Syne', sans-serif; font-size: 2.8rem; font-weight: 800; margin-bottom: 12px; letter-spacing: -1px;">Butterscotch ROMs</h1>
                <p style="font-size: 1.1rem; color: var(--muted); max-width: 600px; line-height: 1.6;">
                    High-performance custom ROMs, ports, and vendor builds for Xiaomi & Redmi devices (fog, kunzite, earth, gale).
                </p>
            </div>"""

# Regex to replace the entire hero-section div
html = re.sub(r'<div class="hero-section">.*?</div>\s*<!-- Filter & Search Hub -->', 
              minimal_hero + '\n\n            <!-- Filter & Search Hub -->', 
              html, flags=re.DOTALL)

with open('index.html', 'w') as f:
    f.write(html)
