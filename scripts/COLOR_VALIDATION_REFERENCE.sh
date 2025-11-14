#!/bin/bash

# Color Verification Script for Mixillo Design System
# This script generates a color reference card for visual validation

cat << 'EOF'

╔════════════════════════════════════════════════════════════════╗
║          MIXILLO COLOR SYSTEM - VALIDATION REFERENCE           ║
║                    7 TikTok-Exact Colors                       ║
╚════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────────┐
│ INSTRUCTIONS:                                                   │
│ 1. Run the Flutter app: flutter run                             │
│ 2. Navigate to each screen below                                │
│ 3. Use device's color picker tool to extract hex values         │
│ 4. Compare against specification                                │
│ 5. Document any deviations in validation report                 │
└─────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════

COLOR 1: BLACK (Primary Background)
───────────────────────────────────────────────────────────────────
  Hex Code:        #000000
  RGB:             (0, 0, 0)
  HSL:             0° 0% 0%
  Usage:           Screen backgrounds, dark surfaces
  Screens:         All 7 screens
  Locations:       
    ✓ Home Feed:     Entire background
    ✓ Camera:        Overlay backgrounds
    ✓ Profile:       Background
    ✓ Discover:      Background
    ✓ Inbox:         Background
    ✓ Live Stream:   Overlay backgrounds
    ✓ Shop:          Background

  Validation Notes:
  □ Appears pure black on iOS
  □ Appears pure black on Android
  □ No color tint visible
  □ Hex code exactly #000000 when picked


═══════════════════════════════════════════════════════════════════

COLOR 2: WHITE (Primary Text)
───────────────────────────────────────────────────────────────────
  Hex Code:        #FFFFFF
  RGB:             (255, 255, 255)
  HSL:             0° 0% 100%
  Usage:           Primary text, highlights
  Screens:         All 7 screens
  Locations:       
    ✓ Home Feed:     Video titles, descriptions
    ✓ Camera:        Timer text, labels
    ✓ Profile:       Username, stats
    ✓ Discover:      Search placeholder, results
    ✓ Inbox:         Message text
    ✓ Live Stream:   Comments, broadcaster name
    ✓ Shop:          Product names, prices

  Validation Notes:
  □ Appears bright white on iOS
  □ Appears bright white on Android
  □ No gray tint visible
  □ Hex code exactly #FFFFFF when picked


═══════════════════════════════════════════════════════════════════

COLOR 3: RED (Accent, CTAs, Highlights)
───────────────────────────────────────────────────────────────────
  Hex Code:        #FE2C55
  RGB:             (254, 44, 85)
  HSL:             350° 99% 58%
  Usage:           Like buttons, follow buttons, highlights
  Screens:         All 7 screens
  Locations:       
    ✓ Home Feed:     Like button, like count
    ✓ Camera:        Record button, indicators
    ✓ Profile:       Follow button, stats highlight
    ✓ Discover:      Active category
    ✓ Inbox:         Activity tab, notifications
    ✓ Live Stream:   LIVE indicator, like counter
    ✓ Shop:          Discount badges, Shop Now button

  Validation Notes:
  □ Bright vibrant red
  □ Matches TikTok's signature red
  □ Hex code #FE2C55 when picked (±2% tolerance: #FE2C40 - #FE2C6A)
  □ RGB (254, 44, 85) when measured
  □ Visible from distance (high contrast)


═══════════════════════════════════════════════════════════════════

COLOR 4: BLUE (Secondary Accent, Icons)
───────────────────────────────────────────────────────────────────
  Hex Code:        #25F4EE
  RGB:             (37, 244, 238)
  HSL:             177° 93% 55%
  Usage:           Secondary CTAs, icons, highlights
  Screens:         All 7 screens
  Locations:       
    ✓ Home Feed:     Share icon, secondary elements
    ✓ Camera:        Status icons
    ✓ Profile:       Message button
    ✓ Discover:      Search icon, trending icons
    ✓ Inbox:         Message icons
    ✓ Live Stream:   Viewer ratings (stars)
    ✓ Shop:          Rating stars, secondary buttons

  Validation Notes:
  □ Bright cyan/turquoise color
  □ Matches TikTok's secondary accent
  □ Hex code #25F4EE when picked
  □ RGB (37, 244, 238) when measured
  □ Highly contrasts with black background


═══════════════════════════════════════════════════════════════════

COLOR 5: DARK GRAY (Secondary Background)
───────────────────────────────────────────────────────────────────
  Hex Code:        #161823
  RGB:             (22, 24, 35)
  HSL:             234° 37% 11%
  Usage:           Card backgrounds, input fields, secondary surfaces
  Screens:         All 7 screens
  Locations:       
    ✓ Home Feed:     Action buttons background
    ✓ Camera:        Mode buttons background
    ✓ Profile:       Video grid backgrounds
    ✓ Discover:      Search bar background
    ✓ Inbox:         Chat list backgrounds
    ✓ Live Stream:   Comments background
    ✓ Shop:          Product cards background

  Validation Notes:
  □ Very dark gray (almost black with slight blue tint)
  □ Slightly lighter than black
  □ Hex code #161823 when picked
  □ RGB (22, 24, 35) when measured
  □ Provides subtle contrast against #000000


═══════════════════════════════════════════════════════════════════

COLOR 6: MEDIUM GRAY (Secondary Text)
───────────────────────────────────────────────────────────────────
  Hex Code:        #8A8B90
  RGB:             (138, 139, 144)
  HSL:             217° 5% 55%
  Usage:           Secondary text, disabled states, captions
  Screens:         All 7 screens
  Locations:       
    ✓ Home Feed:     Video timestamps
    ✓ Camera:        Secondary labels
    ✓ Profile:       Bio text, secondary info
    ✓ Discover:      Trending counts
    ✓ Inbox:         Message previews
    ✓ Live Stream:   Viewer counts
    ✓ Shop:          Original prices, product descriptions

  Validation Notes:
  □ Medium gray color
  □ Readable on black background
  □ Hex code #8A8B90 when picked
  □ RGB (138, 139, 144) when measured
  □ Contrast ratio with black: ~7:1 (excellent)


═══════════════════════════════════════════════════════════════════

COLOR 7: LIGHT GRAY (Disabled, Borders)
───────────────────────────────────────────────────────────────────
  Hex Code:        #BABBBF
  RGB:             (186, 187, 191)
  HSL:             216° 5% 74%
  Usage:           Disabled states, dividers, subtle borders
  Screens:         All 7 screens
  Locations:       
    ✓ Home Feed:     Divider lines
    ✓ Camera:        Disabled buttons
    ✓ Profile:       Border accents
    ✓ Discover:      Input borders
    ✓ Inbox:         Chat dividers
    ✓ Live Stream:   Borders
    ✓ Shop:          Product borders

  Validation Notes:
  □ Light gray color
  □ Used sparingly for disabled/subtle elements
  □ Hex code #BABBBF when picked
  □ RGB (186, 187, 191) when measured
  □ Lower contrast (used for disabled states only)


═══════════════════════════════════════════════════════════════════

VALIDATION CHECKLIST
───────────────────────────────────────────────────────────────────

Color    │ Hex Code │ iOS │ Android │ Exact Match │ Notes
─────────┼──────────┼─────┼─────────┼─────────────┼──────
Black    │ #000000  │  □  │    □    │      □      │
White    │ #FFFFFF  │  □  │    □    │      □      │
Red      │ #FE2C55  │  □  │    □    │      □      │
Blue     │ #25F4EE  │  □  │    □    │      □      │
Dark Gr  │ #161823  │  □  │    □    │      □      │
Med Gray │ #8A8B90  │  □  │    □    │      □      │
Lt Gray  │ #BABBBF  │  □  │    □    │      □      │


CONTRAST VALIDATION
───────────────────────────────────────────────────────────────────

Pairing                        │ Ratio    │ WCAG AA │ Status
───────────────────────────────┼──────────┼─────────┼────────
White on Black                 │ 21:1     │ ✓ Pass  │  □
Red on Black                   │ 5.2:1    │ ✓ Pass  │  □
Blue on Black                  │ 13.1:1   │ ✓ Pass  │  □
Med Gray on Black              │ 7.1:1    │ ✓ Pass  │  □
Lt Gray on Black               │ 10.6:1   │ ✓ Pass  │  □
Dark Gray on Black             │ 1.2:1    │ ✗ Fail  │  □
White on Dark Gray             │ 11.1:1   │ ✓ Pass  │  □


RENDERING QUALITY
───────────────────────────────────────────────────────────────────

□ No banding visible in solid colors
□ No compression artifacts
□ Color gradients smooth (if used)
□ No color shift between iOS and Android
□ No color shift with screen brightness changes
□ Colors appear consistent across app


═══════════════════════════════════════════════════════════════════

DEVIATION REPORT
───────────────────────────────────────────────────────────────────

If any color deviates from specification, document here:

Issue 1:
  Screen:     ___________________
  Component:  ___________________
  Expected:   ___________________
  Actual:     ___________________
  Severity:   [ ] Critical [ ] Major [ ] Minor
  Fix:        ___________________

Issue 2:
  Screen:     ___________________
  Component:  ___________________
  Expected:   ___________________
  Actual:     ___________________
  Severity:   [ ] Critical [ ] Major [ ] Minor
  Fix:        ___________________


═══════════════════════════════════════════════════════════════════

SIGN-OFF
───────────────────────────────────────────────────────────────────

All colors validated:           [ ] Yes  [ ] No
All colors meet spec:           [ ] Yes  [ ] No
All contrast ratios pass WCAG:  [ ] Yes  [ ] No
Ready for next validation step: [ ] Yes  [ ] No

Validator Name:   ___________________
Date:             ___________________
Device(s) Tested: ___________________


═══════════════════════════════════════════════════════════════════

EOF

echo ""
echo "✓ Color validation reference generated"
echo ""
echo "Next steps:"
echo "  1. Run: flutter run"
echo "  2. Test each color on the running app"
echo "  3. Use device's built-in color picker"
echo "  4. Compare against hex values above"
echo "  5. Document any deviations"
echo ""
