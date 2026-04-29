# Projects Configuration

This file documents how to configure the optional `projects.json` file for customizing the projects shown in the MetaGrid Project dropdown.

The dropdown shows a combined list of:
1. **Backend projects** - Projects fetched from the Django backend database
2. **Additional projects** - Extra projects configured via this file (can be STAC or other project types)

**All configuration options (whitelist, blacklist) apply to ALL projects from both sources.**

## Location

The configuration file should be located at:
```
/frontend/public/projects/projects.json
```

In deployed containers, this will be accessible at the root path `/projects/projects.json`.

## Configuration Options

The `projects.json` file supports three optional configuration fields:

### 1. `additionalProjects` (array)

An array of project definitions to add to the project dropdown. These are added to the projects fetched from the backend database.

While these are defined using the STAC project structure, they can represent any type of project (STAC-based or otherwise). The structure allows for flexible facet configuration.

Each project has the following structure:

```json
{
  "name": "Project Display Name",
  "projectName": "PROJECT_CODE",
  "fullName": "Full Project Name",
  "projectUrl": "https://project-website.org",
  "facetsByGroup": {
    "General": ["facet1", "facet2"],
    "Classifications": ["facet3", "facet4"],
    "Labels": ["facet5"]
  }
}
```

**Note:** If this array is empty or omitted, the default STAC projects from `useProjectsConfig.ts` will be used (CMIP6 STAC and CMIP7).

### 2. `whitelist` (array of strings)

An array of project names to show in the dropdown. When specified, **only** projects in this list will be displayed.

**Important:** This filter applies to **ALL projects** (backend database projects AND additional projects).

- If empty or omitted, all projects are shown (except those in the blacklist).
- Takes precedence over blacklist - projects must be in the whitelist to appear.
- Can include backend project names (e.g., "CMIP5", "obs4MIPs") and/or additional project names (e.g., "CMIP6 STAC", "Custom Project").

### 3. `blacklist` (array of strings)

An array of project names to hide from the dropdown.

**Important:** This filter applies to **ALL projects** (backend database projects AND additional projects).

- If empty or omitted, no projects are hidden.
- Ignored if whitelist is specified.
- Can include backend project names and/or additional project names.

## STAC Project Replacement for Legacy Projects

MetaGrid supports automatic project name replacement for STAC projects when legacy counterparts are filtered out. This feature helps manage transitions from legacy to modern STAC-based projects.

### How It Works

When a STAC project (name contains " STAC") exists in the filtered list, but its legacy counterpart (same name without " STAC") does not exist, the STAC project automatically replaces the legacy one by removing " STAC" from its display name.

### Use Cases

#### Scenario 1: Retiring a Legacy Project

When you're ready to retire a legacy project and replace it with its STAC version:

```json
{
  "additionalProjects": [
    {
      "name": "CMIP6 STAC",
      "projectName": "CMIP6",
      "fullName": "Coupled Model Intercomparison Project Phase 6",
      "projectUrl": "https://wcrp-cmip.org/cmip-phases/cmip6/",
      "facetsByGroup": {
        "General": ["mip_era"],
        "Classifications": ["table_id"]
      }
    }
  ],
  "whitelist": [],
  "blacklist": ["CMIP6"]
}
```

**Result:** The dropdown shows "CMIP6" (actually the STAC version with " STAC" removed), not "CMIP6 STAC". This provides a seamless transition for users.

#### Scenario 2: Both Legacy and STAC Available

During transition periods when both versions need to be available:

```json
{
  "additionalProjects": [
    {
      "name": "CMIP6 STAC",
      "projectName": "CMIP6",
      "fullName": "Coupled Model Intercomparison Project Phase 6 (STAC)",
      "projectUrl": "https://wcrp-cmip.org/cmip-phases/cmip6/",
      "facetsByGroup": {
        "General": ["mip_era"],
        "Classifications": ["table_id"]
      }
    }
  ],
  "whitelist": [],
  "blacklist": []
}
```

**Result:** The dropdown shows both "CMIP6" (legacy) and "CMIP6 STAC" (new), allowing users to choose.

#### Scenario 3: Whitelist Only STAC Version

Using whitelist to show only the STAC version:

```json
{
  "additionalProjects": [],
  "whitelist": ["CMIP6 STAC", "CMIP7"],
  "blacklist": []
}
```

**Result:** The dropdown shows "CMIP6" (STAC version with " STAC" removed) and "CMIP7", since the legacy CMIP6 is not in the whitelist.

### Key Behaviors

1. **Automatic Renaming**: STAC projects are only renamed when their legacy counterpart is absent from the filtered list
2. **Differentiation**: When both legacy and STAC versions are present, the STAC version keeps its full name (including " STAC") to differentiate them
3. **Applies to All Filters**: Works with both blacklist and whitelist configurations
4. **Case Sensitive**: The replacement logic looks for the exact pattern " STAC" (with a space before STAC)

### Examples of Projects That Support Replacement

- "CMIP6 STAC" → "CMIP6" (when legacy CMIP6 is filtered out)
- "CMIP7 STAC" → "CMIP7" (when legacy CMIP7 is filtered out)
- "Custom Project STAC" → "Custom Project" (when legacy Custom Project is filtered out)

This feature ensures that project names remain clean and intuitive for end users, regardless of whether the underlying implementation is legacy or STAC-based.

## Example Configurations

### Example 1: Using Default Projects (No Configuration Needed)

Simply omit the file or use an empty configuration:

```json
{
  "additionalProjects": [],
  "whitelist": [],
  "blacklist": []
}
```

This will show all backend database projects plus the default STAC projects (CMIP6 STAC and CMIP7).

### Example 2: Adding Additional Projects

```json
{
  "additionalProjects": [
    {
      "name": "CMIP6 STAC",
      "projectName": "CMIP6",
      "fullName": "Coupled Model Intercomparison Project Phase 6",
      "projectUrl": "https://pcmdi.llnl.gov/CMIP6/",
      "facetsByGroup": {
        "General": ["mip_era"],
        "Classifications": ["table_id"]
      }
    },
    {
      "name": "Custom Institute Project",
      "projectName": "CUSTOM",
      "fullName": "My Custom Institute Climate Project",
      "projectUrl": "https://custom-project.org",
      "facetsByGroup": {
        "General": ["custom_facet"],
        "Classifications": ["custom_classification"]
      }
    }
  ],
  "whitelist": [],
  "blacklist": []
}
```

This adds two additional projects to the dropdown (in addition to backend projects).

### Example 3: Whitelisting Specific Projects (Backend + Additional)

Only show specific projects from both sources:

```json
{
  "additionalProjects": [],
  "whitelist": ["CMIP6 STAC", "CMIP7", "CMIP5", "obs4MIPs"],
  "blacklist": []
}
```

In this example:
- `"CMIP6 STAC"` and `"CMIP7"` are default additional projects
- `"CMIP5"` and `"obs4MIPs"` are backend database projects

Only these four projects will appear in the dropdown.

### Example 4: Blacklisting Specific Projects (Backend + Additional)

Hide certain projects from any source:

```json
{
  "additionalProjects": [],
  "whitelist": [],
  "blacklist": ["All (except CMIP6)", "CMIP3", "Legacy Project"]
}
```

The blacklist can include backend project names and/or additional project names.

### Example 5: Adding Custom Projects with Whitelist

Add additional projects and only show those plus specific backend projects:

```json
{
  "additionalProjects": [
    {
      "name": "Institute Project",
      "projectName": "INST",
      "fullName": "Institute Climate Data Project",
      "projectUrl": "https://institute.edu/project",
      "facetsByGroup": {
        "General": ["mip_era", "institute"],
        "Classifications": ["data_type"]
      }
    }
  ],
  "whitelist": ["Institute Project", "CMIP6 STAC", "CMIP5"],
  "blacklist": []
}
```

This configuration:
- Adds a custom project called "Institute Project"
- Shows only: "Institute Project" (custom), "CMIP6 STAC" (default), and "CMIP5" (backend)
- All other backend and additional projects are hidden

## Deploying with Helm

To override the configuration in your Helm deployment:

```yaml
# values.yaml
configMaps:
  projectsConfig:
    data:
      projects.json: |
        {
          "additionalProjects": [
            {
              "name": "CMIP6 STAC",
              "projectName": "CMIP6",
              "fullName": "Coupled Model Intercomparison Project Phase 6",
              "projectUrl": "https://pcmdi.llnl.gov/CMIP6/",
              "facetsByGroup": {
                "General": ["mip_era"],
                "Classifications": ["table_id"]
              }
            }
          ],
          "whitelist": ["CMIP6 STAC", "CMIP7", "CMIP5"],
          "blacklist": []
        }
```

In this example, the whitelist includes both additional projects ("CMIP6 STAC", "CMIP7") and a backend project ("CMIP5").

Then mount it in your deployment:

```yaml
# deployment.yaml
volumeMounts:
  - name: projects-config
    mountPath: /usr/share/nginx/html/projects/projects.json
    subPath: projects.json

volumes:
  - name: projects-config
    configMap:
      name: projects-config
```

## Testing Locally

1. Edit `/frontend/public/projects/projects.json` with your desired configuration
2. Restart the development server: `npm start`
3. The new configuration will be loaded when the app starts

## Notes

- The configuration is loaded once when the React app initializes
- If the `projects.json` file is not found or cannot be loaded, the app falls back to default behavior:
  - Shows all backend database projects (fetched from Django)
  - Shows default STAC projects from `useProjectsConfig.ts` (CMIP6 STAC and CMIP7)
- Whitelist takes precedence: if both whitelist and blacklist are specified, only the whitelist is applied
- Project names are case-sensitive and must match exactly
- Whitelist/blacklist apply to the **combined list** of ALL projects (backend + additional)
- Additional projects use the StacProject structure but can represent any project type
- The structure provides flexibility for configuring facets regardless of the underlying data source
