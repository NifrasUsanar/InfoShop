# Install On cPanel Shared Hosting

To install InfoShop on cPanel shared hosting, upload the release package and follow the installation wizard at `/install`.

---

## Requirements

- PHP 8.2 or higher
- MySQL 5.7 or higher
- Extensions: `pdo_mysql`, `mbstring`, `openssl`, `tokenizer`, `xml`, `ctype`, `json`, `bcmath`, `gd`, `zip`, `curl`

---

## Steps

### 1. Upload the Application

1. Download the latest release ZIP from the releases page.
2. Log in to cPanel and open **File Manager**.
3. Navigate to `public_html` (or your target subdomain folder).
4. Click **Upload** and select the ZIP file. Wait for the upload to complete.
5. Right-click the uploaded ZIP and select **Extract**.
6. Move all extracted files into the root folder (`public_html`) if they are inside a subfolder.

### 2. Create a MySQL Database

1. In cPanel, go to **MySQL Databases**.
2. Create a new database.
3. Create a database user and assign it to the database with **All Privileges**.
4. Note the database name, username, and password — you will need them during installation.

### 3. Run the Installer

Open your domain in a browser:

```
https://your-domain.com/install
```

Follow the wizard steps:

**Step 1 - Welcome**
Press **Get Started**.

**Step 2 - Server Requirements**
All items should show green checkmarks. If any are red, contact your hosting provider to enable the missing PHP extension. Press **Next** when ready.

**Step 3 - Database Configuration**
Fill in your MySQL credentials:
- Host (usually `localhost`)
- Database Name
- Username
- Password
- Port (default `3306`)

Click **Test Connection** to verify the connection. If successful, press **Next** — credentials are saved to `.env` at this step.

**Step 4 - Application Settings**
Fill in:
- Application Name
- Application URL (e.g. `https://your-domain.com`)
- Timezone

Press **Next** — these settings are saved to `.env` at this step.

**Step 5 - Store Information & Currency**
Fill in:
- Store Name
- Store Address
- Contact Number
- Currency Symbol
- Currency Code
- Currency position, separators, and decimal places

Press **Next**.

**Step 6 - Create Admin Account**
Fill in:
- Full Name
- Username
- Email Address
- Password
- Confirm Password

Press **Next**.

**Step 7 - Install**
The installer will run migrations and set up roles and permissions. Do not refresh or close the browser during this step. Press **Install** to begin.

**Step 8 - Complete**
Click **Go to Login** to access your dashboard.

---

## Troubleshooting

### Images not showing after installation

1. In cPanel File Manager, navigate to the root folder.
2. Delete the `storage/links` folder if it exists.
3. Then visit:
   ```
   https://your-domain.com/storagelink
   ```
   This recreates the storage symlink and images will appear.

### Reinstalling

If you need to reinstall, visit:
```
https://your-domain.com/install/reset
```
This resets the installation state so the wizard can run again.

---

**Installation complete. Log in with the admin credentials you created in Step 6.**
