# Design System Quick Reference

## 🎨 Colors

```dart
// Primary colors
AppColors.primary          // #6C5CE7
AppColors.secondary        // #FF6B9D
AppColors.accent           // #00D4FF

// Theme-aware colors
AppColors.getTextColor(context)
AppColors.getSecondaryTextColor(context)
AppColors.getSurfaceColor(context)
AppColors.getBorderColor(context)
AppColors.getCardColor(context)

// Social actions
AppColors.like             // TikTok red
AppColors.comment
AppColors.share
AppColors.follow
```

## 📏 Spacing

```dart
// Spacing scale
AppSpacing.xs    // 4px
AppSpacing.sm    // 8px
AppSpacing.md    // 16px
AppSpacing.lg    // 24px
AppSpacing.xl    // 32px

// Padding helpers
AppSpacing.screenPadding()
AppSpacing.cardPadding()
AppSpacing.symmetric(horizontal: 16, vertical: 8)
AppSpacing.all(16)

// Border radius
AppSpacing.radiusSm    // 8px
AppSpacing.radiusMd    // 12px
AppSpacing.radiusLg    // 16px
AppSpacing.radiusRound // 999px
```

## 📝 Typography

```dart
// Text styles
AppTypography.headlineLarge(context)
AppTypography.titleLarge(context)
AppTypography.bodyMedium(context)
AppTypography.caption(context)

// Special styles
AppTypography.username(context)
AppTypography.bio(context)
AppTypography.hashtag(context)
AppTypography.button(context)
```

## 💎 Shadows

```dart
// Shadow levels
AppShadows.sm
AppShadows.md
AppShadows.lg
AppShadows.card
AppShadows.button
```

## 🎬 Animations

```dart
// Page transitions
AppAnimations.slideRoute(page)
AppAnimations.fadeRoute(page)
AppAnimations.scaleRoute(page)

// Widget animations
AppAnimations.fadeIn(child: widget)
AppAnimations.slideIn(child: widget)
AppAnimations.scaleIn(child: widget)
```

## 🎯 Components

### PremiumButton
```dart
PremiumButton(
  text: 'Follow',
  variant: ButtonVariant.primary,
  size: ButtonSize.medium,
  icon: Icons.person_add,
  onPressed: () {},
)
```

### PremiumCard
```dart
PremiumCard(
  padding: AppSpacing.cardPadding(),
  child: YourContent(),
)
```

### PremiumInputField
```dart
PremiumInputField(
  label: 'Email',
  hint: 'Enter email',
  controller: controller,
)
```

### SvgIcon
```dart
SvgIcon(
  assetPath: 'Home.svg',
  width: 24,
  height: 24,
)
```

