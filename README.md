# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/511adf8f-2a00-4c58-83dd-148e41718d40

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/511adf8f-2a00-4c58-83dd-148e41718d40) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/511adf8f-2a00-4c58-83dd-148e41718d40) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

### 1) Create `.nvmrc`
Use the current LTS (Vite 5 requires Node >= 18; I recommend 20):
```bash
# at project root
echo "20" > .nvmrc
```
Or pin an exact version:
```bash
echo "v20.11.1" > .nvmrc
```

### 2) Team usage
- First time:
```bash
<code_block_to_apply_changes_from>
```
- Each time you cd into the repo:
```bash
nvm use
```

### 3) Optional: auto-switch on cd
Add to your shell profile (`~/.zshrc` or `~/.bashrc`):
```bash
autoload -U add-zsh-hook
load-nvmrc() {
  local node_version="$(nvm version)"
  local nvmrc_path="$(nvm_find_nvmrc)"
  if [ -n "$nvmrc_path" ]; then
    local nvmrc_node_version=$(cat "$nvmrc_path")
    if [ "$nvmrc_node_version" != "$node_version" ]; then
      nvm install "$nvmrc_node_version"
    fi
  fi
}
add-zsh-hook chpwd load-nvmrc
load-nvmrc
```

### 4) Optional: enforce in `package.json`
Add an `engines` field (doesn’t force nvm, but warns):
```json
"engines": {
  "node": ">=20 <21"
}
```
And to make npm fail on mismatch, add `.npmrc`:
```
engine-strict=true
```

- If you want me to pin to the exact Node version you prefer, tell me the version and I’ll update the snippets.
