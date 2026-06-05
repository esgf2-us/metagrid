# Projects Configuration Guide

This file controls which projects appear in the MetaGrid project dropdown menu.

## Configuration Methods

### For Helm/Kubernetes Deployments

Add `projectsConfig` to your Helm values file:

```yaml
projectsConfig:
  additionalProjects:
    - name: "CMIP6 STAC"
      projectName: "CMIP6"
      fullName: "Coupled Model Intercomparison Project Phase 6"
      projectUrl: "https://wcrp-cmip.org/cmip-phases/cmip6/"
      facetsByGroup:
        General: ["mip_era"]
        Classifications: ["table_id", "variable_id"]
  whitelist: []
  blacklist: []
```

The Helm chart automatically creates a ConfigMap and mounts it. No additional configuration needed.

### For Docker Deployments

**Option 1: Build-time configuration**

Edit `frontend/public/projects/projects.json` before building:

```bash
# Edit the file
vi frontend/public/projects/projects.json

# Build the image
docker compose -f docker-compose.yml -f docker-compose.prod.yml build react
```

**Option 2: Runtime configuration (recommended)**

Create a `custom-projects.json` file and mount it via Docker Compose overlay:

```yaml
# In your docker-compose overlay file (e.g., docker-compose-prod-overlay.yml)
services:
  react:
    volumes:
      - ./custom-projects.json:/usr/share/nginx/html/projects/projects.json:ro
```

Then start your containers:
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose-prod-overlay.yml up
```

## Configuration Structure

```json
{
  "additionalProjects": [],
  "whitelist": [],
  "blacklist": []
}
```

### `additionalProjects` (array)
Add custom projects to the dropdown. These appear alongside projects from the backend database.

**Each project needs:**
- `name`: Display name in the dropdown
- `projectName`: Short project code
- `fullName`: Full descriptive name
- `projectUrl`: Project website URL
- `facetsByGroup`: Search filters organized by category

### `whitelist` (array of strings)
Show only these projects (hides everything else). Leave empty to show all projects.

### `blacklist` (array of strings)
Hide these specific projects. Ignored if whitelist is used.

## Examples

### Example 1: Add a custom project

```json
{
  "additionalProjects": [
    {
      "name": "Regional Climate Model",
      "projectName": "RCM",
      "fullName": "Regional Climate Modeling Project",
      "projectUrl": "https://example.org/rcm",
      "facetsByGroup": {
        "General": ["region", "model_id"],
        "Classifications": ["variable_id", "frequency"],
        "Temporal": ["time_period"]
      }
    }
  ],
  "whitelist": [],
  "blacklist": []
}
```

### Example 2: Show only specific projects

```json
{
  "additionalProjects": [],
  "whitelist": ["CMIP6 STAC", "CMIP7", "obs4MIPs"],
  "blacklist": []
}
```

### Example 3: Hide specific projects

```json
{
  "additionalProjects": [],
  "whitelist": [],
  "blacklist": ["Test Project", "Legacy Data"]
}
```

### Example 4: Add multiple custom projects

```json
{
  "additionalProjects": [
    {
      "name": "Institute Model A",
      "projectName": "MODEL_A",
      "fullName": "Institute Climate Model A",
      "projectUrl": "https://institute.edu/model-a",
      "facetsByGroup": {
        "General": ["experiment_id"],
        "Classifications": ["variable_id"]
      }
    },
    {
      "name": "Institute Model B",
      "projectName": "MODEL_B",
      "fullName": "Institute Climate Model B",
      "projectUrl": "https://institute.edu/model-b",
      "facetsByGroup": {
        "General": ["experiment_id"],
        "Variables": ["variable_id", "cf_standard_name"]
      }
    }
  ],
  "whitelist": [],
  "blacklist": []
}
```

## Facet Groups

Organize search filters into logical groups. Common group names:

- **General**: Basic filters that return many results (e.g., `mip_era`, `activity_id`, `data_node`)
- **Classifications**: Data categorization (e.g., `variable_id`, `frequency`, `table_id`, `realm`)
- **Identifiers**: Unique IDs (e.g., `source_id`, `experiment_id`, `institution_id`)
- **Temporal**: Time-related filters (e.g., `time_period`, `temporal_resolution`)
- **Spatial**: Location filters (e.g., `region`, `domain`, `grid_label`)
- **Labels**: Additional metadata (e.g., `variant_label`, `version`)

You can create custom group names to match your project structure.

### Facet Object Format

Facets can be simple strings or objects for custom display names:

```json
"facetsByGroup": {
  "General": ["mip_era"],
  "Variables": [
    "variable_id",
    { "title": "CF Standard Name", "facet": "variable_cf_standard_name" }
  ]
}
```

## Notes

- Project names are **case-sensitive**
- Changes require container restart (or use development mode for live reload)
- If whitelist is specified, blacklist is ignored
- Projects from backend database + additionalProjects are combined
- Invalid JSON will cause the app to use defaults
- For local development, changes to `frontend/public/projects/projects.json` appear immediately

## Need Help?

See `projects.example.json` for a complete working example with multiple projects.
