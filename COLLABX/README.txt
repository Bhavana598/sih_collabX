COLLABX FINAL ROLE-BASED PROTOTYPE

START HERE:
Open index.html.

FINAL ROLE FLOW:
1. Select Role
2. Login / Sign Up
3. Specific Dashboard

TOP-LEVEL ROLES:
- Citizen
- Government
- University
- Industry
- Platform Admin

CSR is removed.
Community/NGO is combined into Citizen.
Startup/MSME is combined into Industry.

UNIVERSITY:
index.html -> University -> university.html
-> choose University Admin / Faculty / Student
-> university-login.html
-> Login or Sign Up
-> selected dashboard:
   University Admin -> university-admin.html
   Faculty -> faculty.html
   Student -> student.html

FILES:
index.html
role-login.html
signup.html
citizen.html
government.html
university.html
university-login.html
university-admin.html
faculty.html
student.html
industry.html
platform-admin.html

AUTHENTICATION:
This is a front-end demo. Login accepts any non-empty valid email/password and routes to the correct dashboard. No real backend authentication is implemented.

NAVIGATION:
Every dashboard has its own role-specific navigation and Sign out returns to index.html.
