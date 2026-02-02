exports.buildTemplatePayload = (uiData) => {
  const components = [];

  // HEADER
  if (uiData.headerType === "Media") {
    components.push({
      type: "HEADER",
      format: uiData.mediaType.toUpperCase() // IMAGE / VIDEO
    });
  }

  if (uiData.headerType === "Text") {
    components.push({
      type: "HEADER",
      format: "TEXT",
      text: uiData.headerText
    });
  }

  // BODY (required)
  components.push({
    type: "BODY",
    text: uiData.message
  });

  // FOOTER (optional)
  if (uiData.footer) {
    components.push({
      type: "FOOTER",
      text: uiData.footer
    });
  }

  if(uiData.buttons) {
    components.push({
      type: "BUTTONS",
      buttons: uiData.buttons
    });
  }

  return {
    name: uiData.templateName.toLowerCase().replace(/\s+/g, "_"),
    language: uiData.language,
    category: uiData.type.toUpperCase(), // MARKETING
    components,
    components
  };
};
