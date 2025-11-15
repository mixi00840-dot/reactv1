"use client"

import { useState } from "react"
import { useSystemSettings, useUpdateSystemSettings } from "@/hooks/use-api"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Input from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Settings,
  Database,
  DollarSign,
  Mail,
  Shield,
  Zap,
  Server,
  Bell,
  Image,
  Video,
  Save,
  RefreshCw,
  CheckCircle2,
  XCircle
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface SettingCardProps {
  title: string
  description: string
  icon: React.ReactNode
  children: React.ReactNode
}

function SettingCard({ title, description, icon, children }: SettingCardProps) {
  return (
    <Card className="p-6">
      <div className="mb-4 flex items-start gap-3">
        <div className="rounded-lg bg-primary/10 p-2">
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </Card>
  )
}

export default function SystemSettingsPage() {
  const { toast } = useToast()
  const { data: settings, isLoading } = useSystemSettings()
  const updateSettings = useUpdateSystemSettings()

  // Local state for form values
  const [generalSettings, setGeneralSettings] = useState({
    siteName: "",
    siteDescription: "",
    supportEmail: "",
    maintenanceMode: false,
  })

  const [paymentSettings, setPaymentSettings] = useState({
    stripePublishableKey: "",
    stripeSecretKey: "",
    paypalClientId: "",
    paypalSecret: "",
    currency: "USD",
    commissionRate: "15",
  })

  const [contentSettings, setContentSettings] = useState({
    maxVideoSize: "100",
    maxVideoDuration: "180",
    allowedVideoFormats: "mp4,mov,avi",
    autoModeration: true,
    moderationThreshold: "0.7",
  })

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    notificationSound: true,
  })

  const [storageSettings, setStorageSettings] = useState({
    cloudinaryCloudName: "",
    cloudinaryApiKey: "",
    cloudinaryApiSecret: "",
    s3Bucket: "",
    s3Region: "us-east-1",
  })

  const [securitySettings, setSecuritySettings] = useState({
    jwtExpiration: "1h",
    maxLoginAttempts: "5",
    sessionTimeout: "30",
    twoFactorEnabled: false,
    passwordMinLength: "8",
  })

  // Load settings into state
  useState(() => {
    if (settings) {
      setGeneralSettings({
        siteName: settings.siteName || "",
        siteDescription: settings.siteDescription || "",
        supportEmail: settings.supportEmail || "",
        maintenanceMode: settings.maintenanceMode || false,
      })
      // ... populate other settings
    }
  })

  const handleSaveGeneral = async () => {
    try {
      await updateSettings.mutateAsync({
        category: "general",
        settings: generalSettings,
      })
      toast({
        title: "Settings saved",
        description: "General settings have been updated successfully.",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save settings",
        variant: "destructive",
      })
    }
  }

  const handleSavePayment = async () => {
    try {
      await updateSettings.mutateAsync({
        category: "payment",
        settings: paymentSettings,
      })
      toast({
        title: "Settings saved",
        description: "Payment settings have been updated successfully.",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save settings",
        variant: "destructive",
      })
    }
  }

  const handleSaveContent = async () => {
    try {
      await updateSettings.mutateAsync({
        category: "content",
        settings: contentSettings,
      })
      toast({
        title: "Settings saved",
        description: "Content settings have been updated successfully.",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save settings",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
          <p className="text-muted-foreground">
            Configure platform settings and preferences
          </p>
        </div>
      </div>

      {/* System Status Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Database className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-sm text-muted-foreground">Database</p>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="font-semibold">Connected</span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Server className="h-8 w-8 text-purple-600" />
            <div>
              <p className="text-sm text-muted-foreground">Redis Cache</p>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="font-semibold">Active</span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Image className="h-8 w-8 text-orange-600" />
            <div>
              <p className="text-sm text-muted-foreground">CDN Storage</p>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="font-semibold">Cloudinary</span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Zap className="h-8 w-8 text-yellow-600" />
            <div>
              <p className="text-sm text-muted-foreground">API Status</p>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="font-semibold">Healthy</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="payment">Payment</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="storage">Storage</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <SettingCard
            title="Site Information"
            description="Configure basic site information and branding"
            icon={<Settings className="h-5 w-5 text-primary" />}
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="siteName">Site Name</Label>
                <Input
                  id="siteName"
                  value={generalSettings.siteName}
                  onChange={(e) =>
                    setGeneralSettings({ ...generalSettings, siteName: e.target.value })
                  }
                  placeholder="Mixillo"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="siteDescription">Site Description</Label>
                <Textarea
                  id="siteDescription"
                  value={generalSettings.siteDescription}
                  onChange={(e) =>
                    setGeneralSettings({
                      ...generalSettings,
                      siteDescription: e.target.value,
                    })
                  }
                  placeholder="TikTok-style social commerce platform"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="supportEmail">Support Email</Label>
                <Input
                  id="supportEmail"
                  type="email"
                  value={generalSettings.supportEmail}
                  onChange={(e) =>
                    setGeneralSettings({
                      ...generalSettings,
                      supportEmail: e.target.value,
                    })
                  }
                  placeholder="support@mixillo.com"
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label>Maintenance Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Temporarily disable access to the platform
                  </p>
                </div>
                <Button
                  variant={generalSettings.maintenanceMode ? "destructive" : "outline"}
                  size="sm"
                  onClick={() =>
                    setGeneralSettings({
                      ...generalSettings,
                      maintenanceMode: !generalSettings.maintenanceMode,
                    })
                  }
                >
                  {generalSettings.maintenanceMode ? "Enabled" : "Disabled"}
                </Button>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveGeneral} disabled={updateSettings.isPending}>
                  <Save className="mr-2 h-4 w-4" />
                  {updateSettings.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </SettingCard>
        </TabsContent>

        {/* Payment Settings */}
        <TabsContent value="payment" className="space-y-6">
          <SettingCard
            title="Payment Configuration"
            description="Configure payment gateways and commission rates"
            icon={<DollarSign className="h-5 w-5 text-primary" />}
          >
            <div className="space-y-4">
              <div className="space-y-4 rounded-lg border p-4">
                <h4 className="font-semibold">Stripe Configuration</h4>
                <div className="space-y-2">
                  <Label htmlFor="stripePublishableKey">Publishable Key</Label>
                  <Input
                    id="stripePublishableKey"
                    type="password"
                    value={paymentSettings.stripePublishableKey}
                    onChange={(e) =>
                      setPaymentSettings({
                        ...paymentSettings,
                        stripePublishableKey: e.target.value,
                      })
                    }
                    placeholder="pk_test_..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stripeSecretKey">Secret Key</Label>
                  <Input
                    id="stripeSecretKey"
                    type="password"
                    value={paymentSettings.stripeSecretKey}
                    onChange={(e) =>
                      setPaymentSettings({
                        ...paymentSettings,
                        stripeSecretKey: e.target.value,
                      })
                    }
                    placeholder="sk_test_..."
                  />
                </div>
              </div>

              <div className="space-y-4 rounded-lg border p-4">
                <h4 className="font-semibold">PayPal Configuration</h4>
                <div className="space-y-2">
                  <Label htmlFor="paypalClientId">Client ID</Label>
                  <Input
                    id="paypalClientId"
                    type="password"
                    value={paymentSettings.paypalClientId}
                    onChange={(e) =>
                      setPaymentSettings({
                        ...paymentSettings,
                        paypalClientId: e.target.value,
                      })
                    }
                    placeholder="AXx..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paypalSecret">Secret</Label>
                  <Input
                    id="paypalSecret"
                    type="password"
                    value={paymentSettings.paypalSecret}
                    onChange={(e) =>
                      setPaymentSettings({
                        ...paymentSettings,
                        paypalSecret: e.target.value,
                      })
                    }
                    placeholder="EXx..."
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="currency">Default Currency</Label>
                  <Select
                    value={paymentSettings.currency}
                    onValueChange={(value) =>
                      setPaymentSettings({ ...paymentSettings, currency: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="GBP">GBP - British Pound</SelectItem>
                      <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="commissionRate">Platform Commission (%)</Label>
                  <Input
                    id="commissionRate"
                    type="number"
                    min="0"
                    max="100"
                    value={paymentSettings.commissionRate}
                    onChange={(e) =>
                      setPaymentSettings({
                        ...paymentSettings,
                        commissionRate: e.target.value,
                      })
                    }
                    placeholder="15"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSavePayment} disabled={updateSettings.isPending}>
                  <Save className="mr-2 h-4 w-4" />
                  {updateSettings.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </SettingCard>
        </TabsContent>

        {/* Content Settings */}
        <TabsContent value="content" className="space-y-6">
          <SettingCard
            title="Content Management"
            description="Configure video upload limits and moderation"
            icon={<Video className="h-5 w-5 text-primary" />}
          >
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="maxVideoSize">Max Video Size (MB)</Label>
                  <Input
                    id="maxVideoSize"
                    type="number"
                    value={contentSettings.maxVideoSize}
                    onChange={(e) =>
                      setContentSettings({
                        ...contentSettings,
                        maxVideoSize: e.target.value,
                      })
                    }
                    placeholder="100"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxVideoDuration">Max Duration (seconds)</Label>
                  <Input
                    id="maxVideoDuration"
                    type="number"
                    value={contentSettings.maxVideoDuration}
                    onChange={(e) =>
                      setContentSettings({
                        ...contentSettings,
                        maxVideoDuration: e.target.value,
                      })
                    }
                    placeholder="180"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="allowedFormats">Allowed Video Formats</Label>
                <Input
                  id="allowedFormats"
                  value={contentSettings.allowedVideoFormats}
                  onChange={(e) =>
                    setContentSettings({
                      ...contentSettings,
                      allowedVideoFormats: e.target.value,
                    })
                  }
                  placeholder="mp4,mov,avi"
                />
                <p className="text-xs text-muted-foreground">
                  Comma-separated list of allowed formats
                </p>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label>Auto Moderation</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically flag inappropriate content
                  </p>
                </div>
                <Button
                  variant={contentSettings.autoModeration ? "default" : "outline"}
                  size="sm"
                  onClick={() =>
                    setContentSettings({
                      ...contentSettings,
                      autoModeration: !contentSettings.autoModeration,
                    })
                  }
                >
                  {contentSettings.autoModeration ? "Enabled" : "Disabled"}
                </Button>
              </div>

              {contentSettings.autoModeration && (
                <div className="space-y-2">
                  <Label htmlFor="moderationThreshold">Moderation Threshold</Label>
                  <Input
                    id="moderationThreshold"
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={contentSettings.moderationThreshold}
                    onChange={(e) =>
                      setContentSettings({
                        ...contentSettings,
                        moderationThreshold: e.target.value,
                      })
                    }
                    placeholder="0.7"
                  />
                  <p className="text-xs text-muted-foreground">
                    Confidence threshold (0-1) for auto-flagging
                  </p>
                </div>
              )}

              <div className="flex justify-end">
                <Button onClick={handleSaveContent} disabled={updateSettings.isPending}>
                  <Save className="mr-2 h-4 w-4" />
                  {updateSettings.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </SettingCard>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <SettingCard
            title="Notification Preferences"
            description="Configure notification channels and preferences"
            icon={<Bell className="h-5 w-5 text-primary" />}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Send email notifications to users
                  </p>
                </div>
                <Button
                  variant={notificationSettings.emailNotifications ? "default" : "outline"}
                  size="sm"
                  onClick={() =>
                    setNotificationSettings({
                      ...notificationSettings,
                      emailNotifications: !notificationSettings.emailNotifications,
                    })
                  }
                >
                  {notificationSettings.emailNotifications ? "Enabled" : "Disabled"}
                </Button>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label>Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Send push notifications to mobile devices
                  </p>
                </div>
                <Button
                  variant={notificationSettings.pushNotifications ? "default" : "outline"}
                  size="sm"
                  onClick={() =>
                    setNotificationSettings({
                      ...notificationSettings,
                      pushNotifications: !notificationSettings.pushNotifications,
                    })
                  }
                >
                  {notificationSettings.pushNotifications ? "Enabled" : "Disabled"}
                </Button>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label>SMS Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Send SMS notifications for critical events
                  </p>
                </div>
                <Button
                  variant={notificationSettings.smsNotifications ? "default" : "outline"}
                  size="sm"
                  onClick={() =>
                    setNotificationSettings({
                      ...notificationSettings,
                      smsNotifications: !notificationSettings.smsNotifications,
                    })
                  }
                >
                  {notificationSettings.smsNotifications ? "Enabled" : "Disabled"}
                </Button>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label>Notification Sound</Label>
                  <p className="text-sm text-muted-foreground">
                    Play sound for new notifications
                  </p>
                </div>
                <Button
                  variant={notificationSettings.notificationSound ? "default" : "outline"}
                  size="sm"
                  onClick={() =>
                    setNotificationSettings({
                      ...notificationSettings,
                      notificationSound: !notificationSettings.notificationSound,
                    })
                  }
                >
                  {notificationSettings.notificationSound ? "Enabled" : "Disabled"}
                </Button>
              </div>

              <div className="flex justify-end">
                <Button disabled={updateSettings.isPending}>
                  <Save className="mr-2 h-4 w-4" />
                  {updateSettings.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </SettingCard>
        </TabsContent>

        {/* Storage Settings */}
        <TabsContent value="storage" className="space-y-6">
          <SettingCard
            title="Storage Configuration"
            description="Configure CDN and storage providers"
            icon={<Image className="h-5 w-5 text-primary" />}
          >
            <div className="space-y-4">
              <div className="space-y-4 rounded-lg border p-4">
                <h4 className="font-semibold">Cloudinary Configuration</h4>
                <div className="space-y-2">
                  <Label htmlFor="cloudinaryCloudName">Cloud Name</Label>
                  <Input
                    id="cloudinaryCloudName"
                    value={storageSettings.cloudinaryCloudName}
                    onChange={(e) =>
                      setStorageSettings({
                        ...storageSettings,
                        cloudinaryCloudName: e.target.value,
                      })
                    }
                    placeholder="your-cloud-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cloudinaryApiKey">API Key</Label>
                  <Input
                    id="cloudinaryApiKey"
                    type="password"
                    value={storageSettings.cloudinaryApiKey}
                    onChange={(e) =>
                      setStorageSettings({
                        ...storageSettings,
                        cloudinaryApiKey: e.target.value,
                      })
                    }
                    placeholder="123456789012345"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cloudinaryApiSecret">API Secret</Label>
                  <Input
                    id="cloudinaryApiSecret"
                    type="password"
                    value={storageSettings.cloudinaryApiSecret}
                    onChange={(e) =>
                      setStorageSettings({
                        ...storageSettings,
                        cloudinaryApiSecret: e.target.value,
                      })
                    }
                    placeholder="abcdefghijklmnopqrstuvwxyz"
                  />
                </div>
              </div>

              <div className="space-y-4 rounded-lg border p-4">
                <h4 className="font-semibold">AWS S3 Configuration (Optional)</h4>
                <div className="space-y-2">
                  <Label htmlFor="s3Bucket">Bucket Name</Label>
                  <Input
                    id="s3Bucket"
                    value={storageSettings.s3Bucket}
                    onChange={(e) =>
                      setStorageSettings({ ...storageSettings, s3Bucket: e.target.value })
                    }
                    placeholder="my-bucket-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="s3Region">Region</Label>
                  <Select
                    value={storageSettings.s3Region}
                    onValueChange={(value) =>
                      setStorageSettings({ ...storageSettings, s3Region: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="us-east-1">US East (N. Virginia)</SelectItem>
                      <SelectItem value="us-west-2">US West (Oregon)</SelectItem>
                      <SelectItem value="eu-west-1">EU (Ireland)</SelectItem>
                      <SelectItem value="ap-southeast-1">Asia Pacific (Singapore)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end">
                <Button disabled={updateSettings.isPending}>
                  <Save className="mr-2 h-4 w-4" />
                  {updateSettings.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </SettingCard>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
          <SettingCard
            title="Security Configuration"
            description="Configure authentication and security settings"
            icon={<Shield className="h-5 w-5 text-primary" />}
          >
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="jwtExpiration">JWT Token Expiration</Label>
                  <Select
                    value={securitySettings.jwtExpiration}
                    onValueChange={(value) =>
                      setSecuritySettings({ ...securitySettings, jwtExpiration: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15m">15 minutes</SelectItem>
                      <SelectItem value="1h">1 hour</SelectItem>
                      <SelectItem value="24h">24 hours</SelectItem>
                      <SelectItem value="7d">7 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                  <Input
                    id="maxLoginAttempts"
                    type="number"
                    min="1"
                    max="10"
                    value={securitySettings.maxLoginAttempts}
                    onChange={(e) =>
                      setSecuritySettings({
                        ...securitySettings,
                        maxLoginAttempts: e.target.value,
                      })
                    }
                    placeholder="5"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    min="5"
                    max="1440"
                    value={securitySettings.sessionTimeout}
                    onChange={(e) =>
                      setSecuritySettings({
                        ...securitySettings,
                        sessionTimeout: e.target.value,
                      })
                    }
                    placeholder="30"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="passwordMinLength">Min Password Length</Label>
                  <Input
                    id="passwordMinLength"
                    type="number"
                    min="6"
                    max="32"
                    value={securitySettings.passwordMinLength}
                    onChange={(e) =>
                      setSecuritySettings({
                        ...securitySettings,
                        passwordMinLength: e.target.value,
                      })
                    }
                    placeholder="8"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label>Two-Factor Authentication</Label>
                  <p className="text-sm text-muted-foreground">
                    Require 2FA for all admin accounts
                  </p>
                </div>
                <Button
                  variant={securitySettings.twoFactorEnabled ? "default" : "outline"}
                  size="sm"
                  onClick={() =>
                    setSecuritySettings({
                      ...securitySettings,
                      twoFactorEnabled: !securitySettings.twoFactorEnabled,
                    })
                  }
                >
                  {securitySettings.twoFactorEnabled ? "Enabled" : "Disabled"}
                </Button>
              </div>

              <div className="flex justify-end">
                <Button disabled={updateSettings.isPending}>
                  <Save className="mr-2 h-4 w-4" />
                  {updateSettings.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </SettingCard>
        </TabsContent>
      </Tabs>
    </div>
  )
}
