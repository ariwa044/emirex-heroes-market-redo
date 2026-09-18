# Account hold control

## What will change
- Add a separate account hold status for each member.
- Add **Place on hold** and **Restore account** controls in the admin member list.
- When held, block the member account with a clear message: **Account on hold. Your account is currently unavailable. Please contact customer support for assistance.**
- Keep the existing upgrade lock as a separate admin option.

## Technical details
- Store the hold status on each member profile with the existing protected account controls.
- Include the hold status in the account status check and refresh it automatically while the member is signed in.
- Preserve administrator access so the admin can always restore held accounts.
