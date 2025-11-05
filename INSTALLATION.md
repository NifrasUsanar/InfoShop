# Install On cPanel Shared Hosting

To install InfoShop on cPanel shared hosting, access cPanel, and follow the installation prompts for seamless setup.

---

## TIPS

Recommended steps below 👇

---

## Follow These Instructions

1. Zip your project folder.

2. Login to your cPanel.

3. Go to the File Manager option and select it.

4. Ensure you're in the root folder (public_html), then click "Upload".

5. Select your zip folder and wait for the upload to complete. If the upload area is green, then go back to home.

6. Unzip the uploaded folder.

7. Select all files and directory move to the root folder.

8. Go back to cPanel and navigate to Database (MySQL Databases).

9. Create a database and add (create if non exist) a DB user.

10. You can then run your domain in any browser after that:
    `https://your-domain.com/install`

11. **Step 1 - Welcome**
    Press the "Get Started" button that appears on the screen.

12. **Step 2 - Server Requirements**
    Check if all requirements are met (green checkmarks). If any requirement is red, contact your hosting provider to enable it. Then press the "Next" button.

13. **Step 3 - Database Configuration**
    Then fill up the database connection form with:
    - Database Driver (MySQL or SQLite)
    - Database Host (localhost)
    - Database Name (the one you created)
    - Username (the one you created)
    - Password (the one you created)
    
    Click "Test Database Connection" to verify. Then press the "Next" button.

14. **Step 4 - Application Settings**
    Fill out the form with:
    - Application Name
    - Application URL
    - Timezone
    
    Then press the "Next" button.

15. **Step 5 - Store Information & Currency**
    Fill out the form with:
    - Store Name
    - Store Address
    - Contact Number
    - Currency Symbol
    - Currency Code
    - Currency Settings (Position, Separators, Decimal Places)
    
    Then press the "Next" button.

16. **Step 6 - Create Admin Account**
    Fill out the form with:
    - Full Name
    - Username
    - Email Address
    - Password
    - Confirm Password
    
    Then press the "Next" button.

17. **Step 7 - Installation**
    Wait for the installation to complete. Do not refresh or close the browser. The progress will show when it's done.

18. **Step 8 - Complete**
    Click on the "Go to Login" button to complete the installation process and access your dashboard.

---

## UNNECESSARY ERROR

### If no uploaded image is visible

1. Go to File Manager and navigate to the root folder
2. Find and delete the `storage/links` folder if it exists
3. Then go to your URL:
   `https://your-domain.com/storagelink`

This will create the storage link automatically and images will be visible.

---

**Installation is now complete! You can login with the credentials you created in Step 6.**
