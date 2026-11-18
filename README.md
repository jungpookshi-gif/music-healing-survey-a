# Music Healing · Survey A

[Survey](https://jungpookshi-gif.github.io/music-healing-survey-a/) · [Research dashboard](https://jungpookshi-gif.github.io/music-healing-survey-a/admin/) · [Participant information and invitations in five languages](materials/recruitment.md)

This standalone survey for people aged 18 to 65 contains 10 questions in Vietnamese, Korean, English Simplified Chinese and Mongolian. At the end, the participant can optionally give a name and feedback. Names and feedback are stored with the response and excluded from dashboard aggregates. Instrument version `music-healing-survey-a/v2` covers current age, gender, country of residence, study/paid employment, daily listening minutes, frequency of listening when stressed, genre, listening purpose, liking and overall perceived stress.

## Questionnaire changes

| Item | Research decision |
|---|---|
| A01, A02 | Accept completed ages 18–65 in new submissions and allow respondents to decline the gender item. |
| A03 | Ask country of current residence. Country, nationality and cultural identity are different variables. Retain Mongolia, Myanmar and Nepal, and include China. |
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
5. For local analysis choose the `Responses` tab in Sheets and download it as CSV. After signing in, open it in the dashboard with **Open local CSV**. Data stays in browser memory. Use **Return to online data** to restore the authenticated summary. The dashboard reports exclusions, skips older instrument versions, and counts 0 as a score. Both dashboard modes show counts per question, group sizes, means and missing responses. The frequency comparison describes groups in a cross-sectional survey.

## Participant experience

Single-choice answers advance after a confirmed selection. Scales advance when the pointer is released. A valid typed number advances after a brief pause in typing. Enter or Next can also advance immediately. The last page contains the optional name and feedback and requires an explicit submission. Enter in the name field moves focus to feedback.

**Still Harbor** is an original 69-second instrumental loop with soft keys and sustained tones. It starts at 20% player volume after the participant clicks Start and stops at completion. Participants can independently pause playback, adjust volume, or suspend vinyl motion. Music during completion of the questionnaire is a change in survey conditions to consider when comparing responses across rollout dates.

After an online submission is confirmed, **Share survey** shows KakaoTalk, WhatsApp, LINE and Facebook as choices. WhatsApp and LINE open their public share links with the survey URL as the message. Facebook opens its share screen. KakaoTalk opens its official recipient picker when the site’s JavaScript key is configured, or uses device sharing where supported. **Other apps** opens the device’s share menu. The shared URL opens a new survey in the selected language and carries no response data. The result page displays a built-in cover. To replace it, add the approved artwork to `media/` and set its relative path as `coverImage` in `config.js`.

For a dedicated KakaoTalk option, set `kakaoJavaScriptKey` in `config.js` using a Kakao Developers application's browser-facing JavaScript key. Register the production origin both under JavaScript SDK domains and under Product Link web domains in that same Kakao app. Use the JavaScript key intended for the SDK. The Kakao SDK loads only after a confirmed submission and when a key is configured.

## Development

No dependencies or build step. Serve the repository over HTTP. Run `npm test` for questionnaire, CSV and backend summary checks. GitHub Pages serves the root of `main`.
