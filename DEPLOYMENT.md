# Deployment Setup

This repository is configured to automatically deploy to your webserver when you push to the `master` branch.

## GitHub Secrets Configuration

You need to add the following secrets to your GitHub repository:

1. Go to your repository on GitHub: `https://github.com/cmarangon/finance`
2. Click on **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** and add each of the following:

### Required Secrets

| Secret Name | Value |
|-------------|-------|
| `SSH_PRIVATE_KEY` | Your SSH private key (the one corresponding to the public key `ssh-ed25519 AAAAC3...`) |
| `SSH_HOST` | `78.47.171.103` |
| `SSH_USER` | `finance` |
| `SSH_PORT` | `22` |
| `SSH_PATH` | `/home/finance/httpdocs` |

### Getting Your SSH Private Key

The private key should be stored securely on your local machine. To find it:

```bash
# Usually located at one of these paths:
cat ~/.ssh/id_ed25519
# or
cat ~/.ssh/id_rsa
```

**Important:** Copy the ENTIRE private key including the header and footer:
```
-----BEGIN OPENSSH PRIVATE KEY-----
...all the key content...
-----END OPENSSH PRIVATE KEY-----
```

## How Deployment Works

1. **Push to master:** When you push changes to the master branch
2. **Minification:** CSS, JS, and HTML files are automatically minified
3. **Deploy:** Minified files are deployed to `/home/finance/httpdocs` via rsync over SSH
4. **Live:** Your site is immediately updated

## Manual Deployment

You can also trigger deployment manually:
1. Go to **Actions** tab on GitHub
2. Click **Deploy to Webserver**
3. Click **Run workflow**

## Local Development

To run the site locally:
```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080` in your browser.
