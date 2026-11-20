# Music Healing · Survey A

[Survey](https://jungpookshi-gif.github.io/music-healing-survey-a/) · [Research dashboard](https://jungpookshi-gif.github.io/music-healing-survey-a/admin/) · [Participant information and invitations in five languages](materials/recruitment.md)

This standalone survey for people aged 18 to 65 contains 10 questions in Vietnamese, Korean, English, Simplified Chinese and Mongolian. At the end, the participant can optionally give a name and feedback. Names and feedback are stored with the response and excluded from dashboard aggregates. Instrument version `music-healing-survey-a/v2` covers age, gender, cultural background or country of origin, study/paid employment, daily listening minutes, frequency of listening when stressed, genre, listening purpose, liking and overall perceived stress.

## Questionnaire changes

| Item | Research decision |
|---|---|
| A01, A02 | Accept completed ages 18–65 in new submissions and allow respondents to decline the gender item. |
| A03 | Ask cultural background or country of origin. Earlier responses were collected using a country-of-residence question. |
| A04 | Distinguish study only, paid work only, both, neither, and other situations. |
| A05 | Average listening minutes over all seven days, including zero-listening days. |
| A06 | Use a seven-day window and distinguish never listening during stress from experiencing no stress. |
| A07, A09 | Ask one main genre during stressful moments and its liking score. If A06 is never or no stress, A07 stores the inapplicable code and A09 is missing. Changing genre clears the old rating. |
| A08 | Ask for one main reason in the same week and offer no listening during the period. |
| A10 | Ask for overall perceived stress in the past seven days on a single 0–10 item. |

## Data collection and analysis

The public website starts in preview mode whenever `config.js` has an empty endpoint. The participant can complete it and download a local JSON copy. The app confirms online submission when the collector returns the same response ID and acknowledges any supplied name or feedback. Use Deploy → Manage deployments to publish a new Apps Script version while retaining the existing collector URL.

1. Use the dedicated private Google Sheet containing the `Responses` tab. Headers in order: `id,received_at,submitted_at,language,schema,consent,age,gender,culture,status,listen_min,stress_frequency,stress_genre,purpose,genre_like,stress_week,participant_name,feedback`. For an existing v2 sheet, run `setup()` after updating the script to add the last two columns. The original questions, choice codes and analytical fields retain their v2 schema.
2. For a fresh Apps Script installation, set `SHEET_ID` in `backend/Code.gs` to this sheet's ID in the private editor. Run `setup()` once with the sheet owner's account. This creates a key in the private `Admin access` tab. Keep both the sheet and script private.
3. Deploy the collector as a web app, executing as the owner, with access appropriate to the intended participant audience. For anonymous submissions this requires the owner's approval for “Anyone.” Add the resulting `/exec` URL to `config.js`. Verify a submission against the actual sheet before recruitment.
4. Open the administrator address directly and sign in with the password from the private spreadsheet’s Admin access tab. The server verifies it before returning aggregates and unlocking the dashboard. The page clears the password field on submit and locks again on sign-out or navigation.
5. The dashboard shows a valid response count, an expandable summary table for the 10 questions, and six native SVG charts. The heatmap pairs age group and genre within each response. It shows counts in the cells and uses color for percentages within each age group. Three charts show daily listening time, stress scores, and mean stress scores by listening frequency during stress. The scatterplot pairs A05 and A10 and summarizes their observed Spearman rank correlation. The boxplot pairs A07 and A10 and shows individual scores for genre groups with fewer than five responses. The two relationship charts include controls to highlight marks by score or genre. Detailed analyses appear in Korean in the Korean dashboard and in Vietnamese in the other dashboard languages.
6. The charts show their included/total response counts. Heatmap rows and frequency groups with fewer than five responses have distinct marks. They are excluded from the age-group leading-choice and frequency-range summaries. The scatterplot supplements the full-sample correlation with a sensitivity check when durations exceed Q3 + 1.5 IQR. The main plot retains every eligible pair.
7. For local analysis choose the `Responses` tab in Sheets and download it as CSV. After signing in, open it with **Open local CSV**. Use **Return to online data** to restore the authenticated summary. Older collectors that omit joint counts may require a CSV import for the paired charts until their deployment is updated. The dashboard displays exclusions for CSV imports and counts 0 as a valid score.
8. The genre listening map uses matched A07, A09 and A10 responses. Circle area shows response count and dashed outlines indicate fewer than five responses. Genre buttons let you inspect overlapping circles. Each named genre has two original synthesized clips. Enable hover previews once on desktop, or tap a circle or clip to play. The dashboard checks the authenticated online summary once a minute while visible and defers redrawing during playback. For online genre results, update the existing Apps Script deployment so the response includes `genreProfile`. A local Responses CSV or a dated JSON snapshot works with older collectors.

## Participant experience

Single-choice answers advance after a confirmed selection. Scales advance when the pointer is released. A valid typed number advances after a brief pause in typing. Enter or Next can also advance immediately. The last page contains the optional name and feedback and requires an explicit submission. Enter in the name field moves focus to feedback.

**Still Harbor** is an original 69-second instrumental loop with soft keys and sustained tones. It starts at 20% player volume after the participant clicks Start and stops at completion. Participants can independently pause playback, adjust volume, or suspend vinyl motion. Music during completion of the questionnaire is a change in survey conditions to consider when comparing responses across rollout dates.

After an online submission is confirmed, participants can choose **KakaoTalk**, **Facebook Messenger**, or **Open sharing page**. Where supported, the device’s share menu opens with the public survey URL. Available apps in that menu depend on the device. If the browser blocks sharing, the link to the separate sharing page keeps the selected app. It can be opened in Chrome on Android and shared without answering the survey again. KakaoTalk opens its official recipient picker when the site’s JavaScript key is configured. The shared URL opens a new survey in the selected language and carries no response data. The result page displays a built-in cover. To replace it, add the approved artwork to `media/` and set its relative path as `coverImage` in `config.js`.

For a dedicated KakaoTalk option, set `kakaoJavaScriptKey` in `config.js` using a Kakao Developers application's browser-facing JavaScript key. Register the production origin both under JavaScript SDK domains and under Product Link web domains in that same Kakao app. Use the JavaScript key intended for the SDK. The Kakao SDK loads only on the confirmed submission screen or the sharing page and when a key is configured.

## Development

No dependencies or build step. Serve the repository over HTTP. Run `npm test` for questionnaire, CSV and backend summary checks. GitHub Pages serves the root of `main`.
