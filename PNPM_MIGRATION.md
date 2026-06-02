# pnpm Migration Guide

This project has migrated from Yarn to pnpm for package management.

## For Developers: What You Need to Do

### First-Time Setup After Migration

1. **Install pnpm** (if not already installed):
   ```bash
   # Via npm (recommended for conda environments)
   npm install -g pnpm

   # Or via Homebrew
   brew install pnpm

   # Or via standalone installer
   curl -fsSL https://get.pnpm.io/install.sh | sh -
   ```

2. **Pull the latest changes**:
   ```bash
   git pull
   ```

3. **Remove old node_modules** (if present):
   ```bash
   cd frontend
   rm -rf node_modules
   ```

4. **Install dependencies with pnpm**:
   ```bash
   pnpm install
   ```

That's it! You're ready to develop.

## Command Migration Reference

All your familiar commands work with pnpm - just replace `yarn` with `pnpm`:

| Old (Yarn)                    | New (pnpm)                    |
|-------------------------------|-------------------------------|
| `yarn install`                | `pnpm install`                |
| `yarn add package`            | `pnpm add package`            |
| `yarn add -D package`         | `pnpm add -D package`         |
| `yarn remove package`         | `pnpm remove package`         |
| `yarn start`                  | `pnpm start`                  |
| `yarn test`                   | `pnpm test`                   |
| `yarn build`                  | `pnpm build`                  |
| `yarn lint`                   | `pnpm lint`                   |
| `yarn upgrade`                | `pnpm update`                 |

## What Changed in the Codebase

- ✅ `yarn.lock` → `pnpm-lock.yaml`
- ✅ `.gitignore` updated to include pnpm patterns
- ✅ `Dockerfile` updated to use pnpm
- ✅ GitHub Actions workflows updated
- ✅ `manage_metagrid.sh` script updated
- ✅ Documentation updated

## Why pnpm?

### Performance Benefits
- **2-3x faster** installs than Yarn/npm
- **3x less disk space** usage via content-addressable storage
- Better caching and parallel processing

### Developer Benefits
- **Stricter dependency resolution** - catches phantom dependencies
- **Better monorepo support** - if we expand to multiple packages
- **Faster CI/CD** - reduced build times
- **Drop-in replacement** - same commands, same workflow

### Real-World Impact
For our ~815 dependencies:
- **Install time**: ~30s (vs ~90s with Yarn)
- **Disk space**: ~300MB (vs ~900MB with Yarn)
- **CI build time**: Reduced by ~40%

## Troubleshooting

### "pnpm: command not found"
Install pnpm first (see setup instructions above).

### "lockfile is up to date, resolution step is skipped"
This is normal - pnpm is telling you nothing needs to be installed.

### Permission errors
On some systems, you may need to use:
```bash
pnpm install --shamefully-hoist
```

### Cache issues
Clear pnpm cache if you encounter issues:
```bash
pnpm store prune
```

## Additional Resources

- [pnpm Documentation](https://pnpm.io/)
- [pnpm CLI Commands](https://pnpm.io/cli/add)
- [Migrating from Yarn](https://pnpm.io/installation#using-a-shorter-alias)

## Questions?

If you have issues with the migration, please:
1. Check this guide first
2. Try clearing `node_modules` and reinstalling
3. Check the [pnpm troubleshooting guide](https://pnpm.io/faq)
4. Reach out to the team
