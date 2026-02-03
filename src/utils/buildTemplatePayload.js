// exports.buildTemplatePayload = (uiData) => {
//   const components = [];

//   // HEADER
//   if (uiData.headerType === "Media") {
//     components.push({
//       type: "HEADER",
//       format: uiData.mediaType.toUpperCase() // IMAGE / VIDEO
//     });
//   }

//   if (uiData.headerType === "Text") {
//     components.push({
//       type: "HEADER",
//       format: "TEXT",
//       text: uiData.headerText
//     });
//   }

//   // BODY (required)
//   components.push({
//     type: "BODY",
//     text: uiData.message
//   });

//   // FOOTER (optional)
//   if (uiData.footer) {
//     components.push({
//       type: "FOOTER",
//       text: uiData.footer
//     });
//   }

//   if(uiData.buttons) {
//     components.push({
//       type: "BUTTONS",
//       buttons: uiData.buttons
//     });
//   }

//   return {
//     name: uiData.templateName.toLowerCase().replace(/\s+/g, "_"),
//     language: uiData.language,
//     category: uiData.type.toUpperCase(), // MARKETING
//     components,
//     components
//   };
// };


exports.buildTemplatePayload = (uiData) => {
  // ===== STRICT VALIDATION =====
  if (!uiData) throw new Error("Payload missing");

  if (!uiData.templateName)
    throw new Error("templateName required");

  if (!uiData.message)
    throw new Error("message required");

  // ===== COMPONENTS =====
  const components = [];

  // HEADER (IMAGE)
  if (uiData.headerType === "Media") {
    if (!uiData.sampleMediaUrl) {
      throw new Error("sampleMediaUrl required for IMAGE header");
    }

    components.push({
      type: "HEADER",
      format: "IMAGE",
      example: {
        header_url: [uiData.sampleMediaUrl]
      }
    });
  }

  // BODY (MANDATORY)
  components.push({
    type: "BODY",
    text: uiData.message
  });

  // FOOTER
  if (uiData.footer) {
    components.push({
      type: "FOOTER",
      text: uiData.footer
    });
  }

  // BUTTONS (URL ONLY – SAFE)
  if (uiData.buttons && uiData.buttons.length > 0) {
    components.push({
      type: "BUTTONS",
      buttons: uiData.buttons
    });
  }

  // ===== FINAL META PAYLOAD =====
  return {
    name: uiData.templateName
      .toLowerCase()
      .replace(/\s+/g, "_"),

    language: uiData.language,
    category: uiData.type,

    components
  };
};
