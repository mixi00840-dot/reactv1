# Page snapshot

```yaml
- generic [ref=e6]:
  - generic [ref=e7]:
    - img [ref=e8]
    - heading "Mixillo Admin" [level=1] [ref=e10]
    - paragraph [ref=e11]: Sign in to access the admin dashboard (MongoDB)
    - generic [ref=e12]: ✅ Now using MongoDB + JWT Authentication
  - generic [ref=e13]:
    - generic [ref=e14]:
      - generic [ref=e15]: Email or Username
      - generic [ref=e16]:
        - textbox "Email or Username" [active] [ref=e17]
        - group:
          - generic: Email or Username
    - generic [ref=e18]:
      - generic: Password
      - generic [ref=e19]:
        - textbox "Password" [ref=e20]
        - button "toggle password visibility" [ref=e22] [cursor=pointer]:
          - img [ref=e23]
        - group:
          - generic: Password
    - button "Sign In" [ref=e25] [cursor=pointer]: Sign In
  - paragraph [ref=e27]: Admin access only. Contact support if you need assistance.
```