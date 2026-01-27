import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdminAPI } from '@/lib/superadmin';
import { db } from '@/server/db';
import { siteSettings, auditLogs } from '@/shared/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export async function POST(request: NextRequest) {
  const sessionCheck = await requireSuperAdminAPI(request);
  if (sessionCheck instanceof NextResponse) return sessionCheck;

  try {
    const body = await request.json();
    const {
      // Images
      logoUrl,
      faviconUrl,
      splashLogoUrl,
      appIconUrl,
      // Brand Colors
      primaryColor,
      secondaryColor,
      accentColor,
      // Background Colors
      backgroundLight,
      backgroundDark,
      // Text Colors
      textPrimary,
      textSecondary,
      textMuted,
      // Button Colors
      buttonPrimary,
      buttonSecondary,
      buttonSuccess,
      buttonWarning,
      buttonDanger,
      // Border & UI Colors
      borderColor,
      shadowColor,
      // Site Information
      bankName,
      tagline,
      supportEmail,
      supportPhone,
      address,
      copyrightText,
      // Social Media Links
      facebookUrl,
      twitterUrl,
      instagramUrl,
      linkedinUrl,
      whatsappNumber,
      // System Settings
      maintenanceMode,
      registrationEnabled,
    } = body;

    // Validate required fields
    if (!bankName || bankName.trim().length === 0) {
      return NextResponse.json(
        { error: 'Bank name is required' },
        { status: 400 }
      );
    }

    // Validate color formats (must be hex colors)
    const hexColorRegex = /^#[0-9A-F]{6}$/i;
    const colorFields = {
      primaryColor, secondaryColor, accentColor, backgroundLight, backgroundDark,
      textPrimary, textSecondary, textMuted, buttonPrimary, buttonSecondary,
      buttonSuccess, buttonWarning, buttonDanger, borderColor, shadowColor
    };

    for (const [field, value] of Object.entries(colorFields)) {
      if (value && !hexColorRegex.test(value)) {
        return NextResponse.json(
          { error: `Invalid ${field} format. Must be a hex color (e.g., #1e3a8a)` },
          { status: 400 }
        );
      }
    }

    // Check if settings exist
    const existingSettings = await db
      .select()
      .from(siteSettings)
      .limit(1);

    const updateData: any = {
      bankName: bankName.trim(),
      updatedAt: new Date(),
      updatedBy: sessionCheck.id,
    };

    // Only update fields that were provided
    if (logoUrl !== undefined) updateData.logoUrl = logoUrl;
    if (faviconUrl !== undefined) updateData.faviconUrl = faviconUrl;
    if (splashLogoUrl !== undefined) updateData.splashLogoUrl = splashLogoUrl;
    if (appIconUrl !== undefined) updateData.appIconUrl = appIconUrl;

    // Brand Colors
    if (primaryColor) updateData.primaryColor = primaryColor;
    if (secondaryColor) updateData.secondaryColor = secondaryColor;
    if (accentColor) updateData.accentColor = accentColor;

    // Background Colors
    if (backgroundLight) updateData.backgroundLight = backgroundLight;
    if (backgroundDark) updateData.backgroundDark = backgroundDark;

    // Text Colors
    if (textPrimary) updateData.textPrimary = textPrimary;
    if (textSecondary) updateData.textSecondary = textSecondary;
    if (textMuted) updateData.textMuted = textMuted;

    // Button Colors
    if (buttonPrimary) updateData.buttonPrimary = buttonPrimary;
    if (buttonSecondary) updateData.buttonSecondary = buttonSecondary;
    if (buttonSuccess) updateData.buttonSuccess = buttonSuccess;
    if (buttonWarning) updateData.buttonWarning = buttonWarning;
    if (buttonDanger) updateData.buttonDanger = buttonDanger;

    // Border & UI Colors
    if (borderColor) updateData.borderColor = borderColor;
    if (shadowColor) updateData.shadowColor = shadowColor;

    // Site Information
    if (tagline !== undefined) updateData.tagline = tagline;
    if (supportEmail !== undefined) updateData.supportEmail = supportEmail;
    if (supportPhone !== undefined) updateData.supportPhone = supportPhone;
    if (address !== undefined) updateData.address = address;
    if (copyrightText !== undefined) updateData.copyrightText = copyrightText;

    // Social Media Links
    if (facebookUrl !== undefined) updateData.facebookUrl = facebookUrl;
    if (twitterUrl !== undefined) updateData.twitterUrl = twitterUrl;
    if (instagramUrl !== undefined) updateData.instagramUrl = instagramUrl;
    if (linkedinUrl !== undefined) updateData.linkedinUrl = linkedinUrl;
    if (whatsappNumber !== undefined) updateData.whatsappNumber = whatsappNumber;

    // System Settings
    if (maintenanceMode !== undefined) updateData.maintenanceMode = maintenanceMode;
    if (registrationEnabled !== undefined) updateData.registrationEnabled = registrationEnabled;

    if (existingSettings.length > 0) {
      // Update existing settings
      await db
        .update(siteSettings)
        .set(updateData)
        .where(eq(siteSettings.id, existingSettings[0].id));
    } else {
      // Create new settings
      await db.insert(siteSettings).values({
        id: 'default',
        ...updateData,
      });
    }

    // Log the action
    await db.insert(auditLogs).values({
      id: nanoid(),
      userId: sessionCheck.id,
      action: 'UPDATE_SITE_SETTINGS',
      entityType: 'site_settings',
      entityId: existingSettings[0]?.id || 'default',
      details: `Updated site settings: ${Object.keys(body).join(', ')}`,
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true, message: 'Settings updated successfully' });
  } catch (error: any) {
    console.error('Settings update error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update settings' },
      { status: 500 }
    );
  }
}
