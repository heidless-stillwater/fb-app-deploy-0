import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const fileUrl = searchParams.get('fileUrl');

  if (!fileUrl) {
    return new NextResponse('Missing fileUrl parameter', { status: 400 });
  }

  try {
    const fileResponse = await fetch(fileUrl);

    if (!fileResponse.ok) {
      throw new Error(`Failed to fetch file: ${fileResponse.statusText}`);
    }

    const headers = new Headers();
    // Copy essential headers from the original response
    headers.set('Content-Type', fileResponse.headers.get('Content-Type') || 'application/octet-stream');
    headers.set('Content-Length', fileResponse.headers.get('Content-Length') || '');
    
    // This header is crucial for prompting a download
    const fileName = new URL(fileUrl).pathname.split('/').pop();
    headers.set('Content-Disposition', `attachment; filename="${fileName}"`);
    
    return new NextResponse(fileResponse.body, {
        status: 200,
        statusText: 'OK',
        headers,
    });
    
  } catch (error: any) {
    console.error('Download proxy error:', error);
    return new NextResponse(`An error occurred: ${error.message}`, { status: 500 });
  }
}
