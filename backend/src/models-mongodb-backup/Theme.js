const mongoose = require('mongoose');

const themeSchema = new mongoose.Schema({
  // Theme identification
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  
  displayName: {
    type: String,
    required: true
  },
  
  description: String,
  
  version: {
    type: String,
    default: '1.0.0'
  },
  
  // Theme preview
  thumbnail: String,
  screenshots: [String],
  
  // Color scheme
  colors: {
    // Primary colors
    primary: {
      type: String,
      default: '#6366F1'
    },
    primaryDark: String,
    primaryLight: String,
    
    // Secondary colors
    secondary: {
      type: String,
      default: '#EC4899'
    },
    secondaryDark: String,
    secondaryLight: String,
    
    // Accent colors
    accent: String,
    accentDark: String,
    accentLight: String,
    
    // Background colors
    background: {
      type: String,
      default: '#FFFFFF'
    },
    backgroundSecondary: {
      type: String,
      default: '#F9FAFB'
    },
    backgroundTertiary: String,
    
    // Text colors
    textPrimary: {
      type: String,
      default: '#111827'
    },
    textSecondary: {
      type: String,
      default: '#6B7280'
    },
    textTertiary: String,
    textInverse: {
      type: String,
      default: '#FFFFFF'
    },
    
    // Border colors
    border: {
      type: String,
      default: '#E5E7EB'
    },
    borderLight: String,
    borderDark: String,
    
    // Status colors
    success: {
      type: String,
      default: '#10B981'
    },
    warning: {
      type: String,
      default: '#F59E0B'
    },
    error: {
      type: String,
      default: '#EF4444'
    },
    info: {
      type: String,
      default: '#3B82F6'
    },
    
    // Custom colors
    custom: mongoose.Schema.Types.Mixed
  },
  
  // Typography
  typography: {
    // Font families
    fontFamilyPrimary: {
      type: String,
      default: 'Inter, system-ui, sans-serif'
    },
    fontFamilySecondary: String,
    fontFamilyMono: {
      type: String,
      default: 'Menlo, Monaco, monospace'
    },
    
    // Font sizes
    fontSizeBase: {
      type: String,
      default: '16px'
    },
    fontSizeXs: String,
    fontSizeSm: String,
    fontSizeMd: String,
    fontSizeLg: String,
    fontSizeXl: String,
    fontSize2xl: String,
    fontSize3xl: String,
    
    // Font weights
    fontWeightLight: {
      type: Number,
      default: 300
    },
    fontWeightNormal: {
      type: Number,
      default: 400
    },
    fontWeightMedium: {
      type: Number,
      default: 500
    },
    fontWeightSemibold: {
      type: Number,
      default: 600
    },
    fontWeightBold: {
      type: Number,
      default: 700
    },
    
    // Line heights
    lineHeightTight: {
      type: Number,
      default: 1.2
    },
    lineHeightNormal: {
      type: Number,
      default: 1.5
    },
    lineHeightRelaxed: {
      type: Number,
      default: 1.75
    },
    
    // Letter spacing
    letterSpacingTight: String,
    letterSpacingNormal: String,
    letterSpacingWide: String
  },
  
  // Spacing scale
  spacing: {
    unit: {
      type: Number,
      default: 4 // 4px base unit
    },
    xs: Number,
    sm: Number,
    md: Number,
    lg: Number,
    xl: Number,
    xxl: Number
  },
  
  // Border radius
  borderRadius: {
    none: {
      type: String,
      default: '0'
    },
    sm: {
      type: String,
      default: '0.125rem'
    },
    md: {
      type: String,
      default: '0.375rem'
    },
    lg: {
      type: String,
      default: '0.5rem'
    },
    xl: {
      type: String,
      default: '0.75rem'
    },
    full: {
      type: String,
      default: '9999px'
    }
  },
  
  // Shadows
  shadows: {
    sm: {
      type: String,
      default: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
    },
    md: {
      type: String,
      default: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
    },
    lg: {
      type: String,
      default: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
    },
    xl: {
      type: String,
      default: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
    }
  },
  
  // Component styles
  components: {
    // Buttons
    button: {
      borderRadius: String,
      padding: String,
      fontSize: String,
      fontWeight: Number
    },
    
    // Input fields
    input: {
      borderRadius: String,
      padding: String,
      borderColor: String,
      focusBorderColor: String
    },
    
    // Cards
    card: {
      borderRadius: String,
      padding: String,
      shadow: String,
      backgroundColor: String
    },
    
    // Navigation
    navbar: {
      height: String,
      backgroundColor: String,
      textColor: String,
      shadow: String
    },
    
    // Custom component styles
    custom: mongoose.Schema.Types.Mixed
  },
  
  // Layout settings
  layout: {
    maxWidth: {
      type: String,
      default: '1280px'
    },
    containerPadding: String,
    gridGap: String,
    sidebarWidth: String
  },
  
  // Animations
  animations: {
    transitionDuration: {
      type: String,
      default: '200ms'
    },
    transitionTiming: {
      type: String,
      default: 'ease-in-out'
    },
    enableAnimations: {
      type: Boolean,
      default: true
    }
  },
  
  // Dark mode
  darkMode: {
    enabled: {
      type: Boolean,
      default: false
    },
    colors: mongoose.Schema.Types.Mixed,
    autoSwitch: Boolean,
    switchTime: String
  },
  
  // Custom CSS
  customCSS: {
    global: String,
    mobile: String,
    tablet: String,
    desktop: String
  },
  
  // Custom JavaScript
  customJS: String,
  
  // External resources
  externalResources: {
    fonts: [String], // Google Fonts URLs, etc.
    stylesheets: [String],
    scripts: [String]
  },
  
  // Responsive breakpoints
  breakpoints: {
    mobile: {
      type: Number,
      default: 640
    },
    tablet: {
      type: Number,
      default: 768
    },
    desktop: {
      type: Number,
      default: 1024
    },
    wide: {
      type: Number,
      default: 1280
    }
  },
  
  // Status
  status: {
    type: String,
    enum: ['draft', 'active', 'inactive', 'archived'],
    default: 'draft',
    index: true
  },
  
  isDefault: {
    type: Boolean,
    default: false,
    index: true
  },
  
  // Usage tracking
  stats: {
    timesApplied: {
      type: Number,
      default: 0
    },
    activeUsers: {
      type: Number,
      default: 0
    },
    lastUsed: Date
  },
  
  // Metadata
  tags: [String],
  category: {
    type: String,
    enum: ['minimal', 'modern', 'classic', 'bold', 'elegant', 'playful', 'professional', 'custom'],
    default: 'modern'
  },
  
  author: {
    name: String,
    url: String
  },
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  notes: String
  
}, {
  timestamps: true
});

// Indexes
themeSchema.index({ status: 1, isDefault: 1 });
themeSchema.index({ category: 1, status: 1 });

// Ensure only one default theme
themeSchema.pre('save', async function(next) {
  if (this.isDefault && this.isModified('isDefault')) {
    await this.constructor.updateMany(
      { _id: { $ne: this._id }, isDefault: true },
      { isDefault: false }
    );
  }
  next();
});

// Virtual for CSS variables
themeSchema.virtual('cssVariables').get(function() {
  const vars = {};
  
  // Colors
  Object.entries(this.colors).forEach(([key, value]) => {
    if (typeof value === 'string') {
      vars[`--color-${key}`] = value;
    }
  });
  
  // Typography
  if (this.typography.fontFamilyPrimary) {
    vars['--font-primary'] = this.typography.fontFamilyPrimary;
  }
  if (this.typography.fontSizeBase) {
    vars['--font-size-base'] = this.typography.fontSizeBase;
  }
  
  // Spacing
  if (this.spacing.unit) {
    vars['--spacing-unit'] = `${this.spacing.unit}px`;
  }
  
  // Border radius
  Object.entries(this.borderRadius).forEach(([key, value]) => {
    vars[`--radius-${key}`] = value;
  });
  
  return vars;
});

// Instance Methods

// Activate theme
themeSchema.methods.activate = async function() {
  this.status = 'active';
  this.stats.timesApplied += 1;
  this.stats.lastUsed = Date.now();
  await this.save();
};

// Deactivate theme
themeSchema.methods.deactivate = async function() {
  if (this.isDefault) {
    throw new Error('Cannot deactivate default theme');
  }
  this.status = 'inactive';
  await this.save();
};

// Generate CSS string
themeSchema.methods.generateCSS = function() {
  const vars = this.cssVariables;
  
  let css = ':root {\n';
  Object.entries(vars).forEach(([key, value]) => {
    css += `  ${key}: ${value};\n`;
  });
  css += '}\n\n';
  
  // Add custom CSS
  if (this.customCSS.global) {
    css += this.customCSS.global + '\n';
  }
  
  // Add responsive CSS
  if (this.customCSS.mobile) {
    css += `@media (max-width: ${this.breakpoints.mobile}px) {\n`;
    css += this.customCSS.mobile + '\n';
    css += '}\n\n';
  }
  
  if (this.customCSS.tablet) {
    css += `@media (min-width: ${this.breakpoints.mobile + 1}px) and (max-width: ${this.breakpoints.tablet}px) {\n`;
    css += this.customCSS.tablet + '\n';
    css += '}\n\n';
  }
  
  if (this.customCSS.desktop) {
    css += `@media (min-width: ${this.breakpoints.desktop}px) {\n`;
    css += this.customCSS.desktop + '\n';
    css += '}\n';
  }
  
  return css;
};

// Duplicate theme
themeSchema.methods.duplicate = async function(newName, userId) {
  const duplicate = new this.constructor({
    ...this.toObject(),
    _id: undefined,
    name: newName,
    displayName: `${this.displayName} (Copy)`,
    status: 'draft',
    isDefault: false,
    createdBy: userId,
    lastModifiedBy: userId,
    stats: {
      timesApplied: 0,
      activeUsers: 0
    }
  });
  
  await duplicate.save();
  return duplicate;
};

// Static Methods

// Get active theme
themeSchema.statics.getActive = async function() {
  return this.findOne({ status: 'active', isDefault: true });
};

// Get default theme
themeSchema.statics.getDefault = async function() {
  let theme = await this.findOne({ isDefault: true });
  
  if (!theme) {
    // Create default theme if none exists
    theme = await this.create({
      name: 'default',
      displayName: 'Default Theme',
      description: 'Clean and modern default theme',
      status: 'active',
      isDefault: true
    });
  }
  
  return theme;
};

// Get all available themes
themeSchema.statics.getAvailable = async function() {
  return this.find({ status: { $in: ['active', 'inactive'] } })
    .sort({ isDefault: -1, createdAt: -1 });
};

const Theme = mongoose.model('Theme', themeSchema);

module.exports = { Theme };
