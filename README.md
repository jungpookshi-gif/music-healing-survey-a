# Music Healing · Survey A

[Survey](https://jungpookshi-gif.github.io/music-healing-survey-a/) · [Research dashboard](https://jungpookshi-gif.github.io/music-healing-survey-a/admin/) · [Participant information and invitations in four languages](materials/recruitment.md)

This standalone adult survey contains 10 questions in Vietnamese, Korean, English and Simplified Chinese. Instrument version `music-healing-survey-a/v2` covers current age, gender, country of residence, study/paid employment, daily listening minutes, frequency of listening when stressed, genre, listening purpose, liking and overall perceived stress.

## Questionnaire changes

| Item | Research decision |
|---|---|
| A01, A02 | Record completed years and allow respondents to decline the gender item. |
| A03 | Ask country of current residence. Country, nationality and cultural identity are different variables. Retain Mongolia, Myanmar and Nepal, and include China. |
| A04 | Distinguish study only, paid work only, both, neither, and other situations. |
| A05 | Average listening minutes over all seven days, including zero-listening days. |
| A06 | Use a seven-day window and distinguish never listening during stress from experiencing no stress. |
| A07, A09 | Ask one main genre during stressful moments and its liking score. If A06 is never or no stress, A07 stores the inapplicable code and A09 is missing. Changing genre clears the old rating. |
| A08 | Ask for one main reason in the same week and offer no listening during the period. |
| A10 | Ask for overall perceived stress in the past seven days on a single 0–10 item. |

## Data collection and analysis

The public website starts in preview mode whenever `config.js` has an empty endpoint. The participant can complete it and download a local JSON copy. The app confirms online submission only when the collector returns the same response ID.

1. Use the dedicated private Google Sheet containing the `Responses` tab. Headers in order: `id,received_at,submitted_at,language,schema,consent,age,gender,culture,status,listen_min,stress_frequency,stress_genre,purpose,genre_like,stress_week`.
2. For a fresh Apps Script installation, set `SHEET_ID` in `backend/Code.gs` to this sheet's ID in the private editor. Run `setup()` once with the sheet owner's account. This creates a key in the private `Admin access` tab. Keep both the sheet and script private.
3. Deploy the collector as a web app, executing as the owner, with access appropriate to the intended participant audience. For anonymous submissions this requires the owner's approval for “Anyone.” Add the resulting `/exec` URL to `config.js`. Verify a submission against the actual sheet before recruitment.
4. The dashboard requests aggregates with the admin key in a POST body. The browser clears the password after the request. No respondent rows are returned by the summary endpoint.
5. For local analysis choose the `Responses` tab in Sheets and download it as CSV. Open it in the dashboard with **Open local CSV**. This works even without an online collector. Data stays in browser memory. Use **Close data** to clear the view. The dashboard reports exclusions, skips older instrument versions, and counts 0 as a score. Both dashboard modes show counts per question, group sizes, means and missing responses. The frequency comparison describes groups in a cross-sectional survey.

## Development

No dependencies or build step. Serve the repository over HTTP. Run `npm test` for questionnaire, CSV and backend summary checks. GitHub Pages serves the root of `main`.
