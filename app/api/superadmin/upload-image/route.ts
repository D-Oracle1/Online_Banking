import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdminAPI } from '@/lib/superadmin';
import { uploadLogo, uploadFavicon, uploadSplashLogo, uploadAppIcon } from '@/lib/upload';

const validTypes = ['logo', 'favicon', 'splashLogo', 'appIcon'] as const;
type ImageType = typeof validTypes[number];

const typeNameMap: Record<ImageType, string> = {
  logo: 'Logo',
  favicon: 'Favicon',
  splashLogo: 'Splash Logo',
  appIcon: 'App Icon',
};

export async function POST(request: NextRequest) {
  const sessionCheck = await requireSuperAdminAPI(request);
  if (sessionCheck instanceof NextResponse) return sessionCheck;

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as ImageType;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!type || !validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Upload based on type
    let result;
    switch (type) {
      case 'logo':
        result = await uploadLogo(file);
        break;
      case 'favicon':
        result = await uploadFavicon(file);
        break;
      case 'splashLogo':
        result = await uploadSplashLogo(file);
        break;
      case 'appIcon':
        result = await uploadAppIcon(file);
        break;
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Upload failed' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      url: result.url,
      message: `${typeNameMap[type]} uploaded successfully`,
    });
  } catch (error: any) {
    console.error('Image upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload image' },
      { status: 500 }
    );
  }
}
