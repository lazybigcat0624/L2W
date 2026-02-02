const GOOGLE_SHEETS_WEB_APP_URL = process.env.EXPO_PUBLIC_GOOGLE_SHEETS_WEB_APP_URL || '';

export interface FeedbackSubmission {
  questionId: number;
  question: string;
  answer: string;
  level: number;
}

/**
 * Submit feedback answer to Google Sheets
 */
export async function submitFeedbackToGoogleSheets(
  submission: FeedbackSubmission
): Promise<boolean> {
  if (!GOOGLE_SHEETS_WEB_APP_URL) {
    console.warn('Google Sheets web app URL not configured. Feedback will not be submitted.');
    console.log('Feedback submission (not sent):', submission);
    return false;
  }

  // Validate URL format
  if (!GOOGLE_SHEETS_WEB_APP_URL.includes('script.google.com/macros/s/')) {
    console.error('Invalid Google Apps Script URL format. Expected: https://script.google.com/macros/s/.../exec');
    console.log('Current URL:', GOOGLE_SHEETS_WEB_APP_URL);
    return false;
  }

  try {
    // First try with normal fetch to get actual error codes
    console.log('Submitting feedback to Google Sheets:', submission);
    console.log('GOOGLE_SHEETS_WEB_APP_URL:', GOOGLE_SHEETS_WEB_APP_URL);
    const response = await fetch(GOOGLE_SHEETS_WEB_APP_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(submission),
    });

    if (response.status === 404) {
      console.error('404 Not Found: The Google Apps Script web app URL is incorrect or the deployment does not exist.');
      console.error('Please verify:');
      console.error('1. The URL is correct: ', GOOGLE_SHEETS_WEB_APP_URL);
      console.error('2. The web app is deployed (Deploy > Manage deployments)');
      console.error('3. The deployment is active and not deleted');
      // Still try with no-cors as fallback (might work if it's just a CORS issue)
      try {
        await fetch(GOOGLE_SHEETS_WEB_APP_URL, {
          method: 'POST',
          mode: 'no-cors',
          body: JSON.stringify(submission),
        });
        console.warn('Attempted with no-cors mode (response not verifiable)');
        return true;
      } catch {
        return false;
      }
    }

    if (response.status === 401) {
      console.error('401 Unauthorized: Please redeploy your Google Apps Script web app with "Anyone" access');
      return false;
    }

    if (!response.ok) {
      console.error(`HTTP error! status: ${response.status}`);
      return false;
    }

    const result = await response.json();
    return result.success === true;
  } catch (error: any) {
    // If it's a CORS or network error, try with no-cors
    if (error.message?.includes('CORS') || error.message?.includes('Failed to fetch') || error.name === 'TypeError') {
      console.warn('CORS/Network error detected, trying with no-cors mode...');
      try {
        await fetch(GOOGLE_SHEETS_WEB_APP_URL, {
          method: 'POST',
          mode: 'no-cors',
          body: JSON.stringify(submission),
        });
        // With no-cors, we can't verify, but assume success if no error
        console.log('Sent with no-cors mode (response not verifiable)');
        return true;
      } catch (noCorsError) {
        console.error('Error with no-cors fallback:', noCorsError);
        return false;
      }
    }
    
    console.error('Error submitting feedback to Google Sheets:', error);
    return false;
  }
}
