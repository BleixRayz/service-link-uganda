# Service Link Uganda — Static Website (expanded)

I updated the site so clients can browse many services by category and search. The site now:

- Loads services from services.json (so you can add many entries without editing HTML).
- Shows category chips (All, Computer, Engineering, Construction, Healthcare, Government, Finance, Agriculture, etc.).
- Filters links by category and search query.
- Preserves previous features: copy-to-clipboard, open-in-new-tab, animated reveal, theme toggle, and toast messages.

Files changed/added:
- index.html — updated to include category toolbar and dynamic grid
- script.js — now fetches services.json and renders cards with filtering
- styles.css — small styles for category chips
- services.json — many sample services across categories
- README.md — updated to reflect the dynamic approach

How to add services
- Edit services.json and add objects with: name, url, category, description, icon, tags.
- The site automatically picks up new entries.

Want me to:
- Import services from a CSV or Google Sheet and convert to services.json.
- Add pagination or infinite scroll for very large lists.
- Add categories count badges and sorting (alphabetical or popularity).

Tell me which enhancement you want next and I’ll add it.