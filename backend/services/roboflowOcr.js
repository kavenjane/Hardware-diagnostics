const path = require("path");
const fs = require("fs");
const Roboflow = require("roboflow");

function isHttpUrl(value) {
  return /^https?:\/\//i.test(String(value || ""));
}

function normalizeImageSource(image) {
  if (!image || typeof image !== "string") {
    throw new Error("image must be a non-empty string path or URL");
  }

  if (isHttpUrl(image)) {
    return image;
  }

  const resolvedPath = path.resolve(image);
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Image file not found: ${resolvedPath}`);
  }

  return resolvedPath;
}

/**
 * Perform OCR prediction using Roboflow JS SDK.
 *
 * @param {Object} params
 * @param {string} params.image - Local file path or public image URL.
 * @param {string} [params.projectName="your-project-name"] - Roboflow project name.
 * @param {number} [params.version=1] - Project version number.
 * @param {string} [params.workspaceName] - Optional workspace slug.
 * @param {string} [params.apiKey] - Optional API key override (falls back to process.env.ROBOFLOW_API_KEY).
 * @returns {Promise<Object>} Roboflow prediction JSON.
 */
async function runRoboflowOcr({
  image,
  projectName = "your-project-name",
  version = 1,
  workspaceName,
  apiKey
} = {}) {
  try {
    const resolvedApiKey = apiKey || process.env.ROBOFLOW_API_KEY;
    if (!resolvedApiKey) {
      throw new Error("ROBOFLOW_API_KEY is not set");
    }

    if (!projectName || typeof projectName !== "string") {
      throw new Error("projectName must be a non-empty string");
    }

    if (!Number.isInteger(Number(version)) || Number(version) <= 0) {
      throw new Error("version must be a positive integer");
    }

    const imageSource = normalizeImageSource(image);

    const rf = new Roboflow({ apiKey: resolvedApiKey });
    const workspace = workspaceName ? rf.workspace(workspaceName) : rf.workspace();
    const project = await workspace.project(projectName);
    const model = project.version(Number(version)).model;

    const prediction = await model.predict(imageSource);
    return prediction;
  } catch (error) {
    throw new Error(`Roboflow OCR failed: ${error.message}`);
  }
}

module.exports = {
  runRoboflowOcr
};

if (require.main === module) {
  (async () => {
    const image = process.argv[2];

    if (!image) {
      console.error("Usage: node services/roboflowOcr.js <image-path-or-url> [projectName] [version] [workspaceName]");
      process.exit(1);
    }

    const projectName = process.argv[3] || "your-project-name";
    const version = Number(process.argv[4] || 1);
    const workspaceName = process.argv[5];

    try {
      const result = await runRoboflowOcr({ image, projectName, version, workspaceName });
      console.log(JSON.stringify(result, null, 2));
    } catch (error) {
      console.error(error.message);
      process.exit(1);
    }
  })();
}
