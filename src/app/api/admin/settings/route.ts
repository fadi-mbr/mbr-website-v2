import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getSettings, updateSetting } from '@/lib/booking/settings';

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      console.error('Admin settings: No session found');
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Please sign in' },
        { status: 401 }
      );
    }

    // Check if user is admin (email ends with @mbrme.com)
    if (!session.user.email.endsWith('@mbrme.com')) {
      console.error('Admin settings: Access denied for', session.user.email);
      return NextResponse.json(
        { success: false, error: 'Forbidden: Admin access required (@mbrme.com email)' },
        { status: 403 }
      );
    }

    console.log('Admin settings: Fetching settings for', session.user.email);
    const settings = await getSettings();
    console.log('Admin settings: Settings fetched successfully');
    
    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error('Admin settings fetch error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch settings';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin (email ends with @mbrme.com)
    if (!session.user.email.endsWith('@mbrme.com')) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { key, value } = body;

    if (!key) {
      return NextResponse.json(
        { error: 'Setting key is required' },
        { status: 400 }
      );
    }

    await updateSetting(key, value);
    
    return NextResponse.json({
      success: true,
      message: 'Setting updated successfully',
    });
  } catch (error) {
    console.error('Admin settings update error:', error);
    return NextResponse.json(
      { error: 'Failed to update setting' },
      { status: 500 }
    );
  }
}

