# Security Best Practices

## Authentication Patterns
- Use strong, hashed passwords. Employ algorithms like Argon2 or BCrypt.
- Implement multi-factor authentication (MFA) for sensitive operations.
- Use OAuth 2.0 or OpenID Connect for trusted third-party authentication.

## Rate Limiting Implementation
- Apply rate limiting to API endpoints to mitigate DDoS attacks. 
- Use libraries or middleware that allow you to configure rate limits per route or globally.

## Input Validation with Zod
- Utilize Zod for schema-based input validation to ensure data integrity.
- Example:
  ```javascript
  import { z } from 'zod';
  
  const UserSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8)
  });
  ```

## CORS Configuration
- Set up proper CORS headers to restrict resources to specific origins. 
- Example:
  ```javascript
  const cors = require('cors');
  app.use(cors({ origin: 'https://yourdomain.com' }));
  ```

## JWT Handling
- Use secure methods to issue and verify JWTs. Store secrets securely and use short-lived tokens.
- Example:
  ```javascript
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
  ```

## SQL Injection Prevention
- Use prepared statements or ORM libraries to prevent SQL injection attacks.
- Example:
  ```javascript
  db.query('SELECT * FROM users WHERE id = ?', [userId]);
  ```

By following these best practices, you can significantly enhance the security posture of your applications.