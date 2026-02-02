exports.buildTemplatePayload = (uiData) => {
  console.log("uiDatauiDatauiDatauiData", uiData);

  const components = [];

  // HEADER
  if (uiData.headerType === "Media") {
    components.push({
      type: "HEADER",
      format: uiData.mediaType.toUpperCase(), // IMAGE / VIDEO ,
      example: {
        header_handle: [uiData.media_upload_id], // Use the uploaded media ID
      },
    });
  }

  if (uiData.headerType === "Text") {
    components.push({
      type: "HEADER",
      format: "TEXT",
      text: uiData.headerText,
    });
  }

  // BODY (required)
  components.push({
    type: "BODY",
    text: uiData.message,
  });

  // FOOTER (optional)
  if (uiData.footer) {
    components.push({
      type: "FOOTER",
      text: uiData.footer,
    });
  }

  if (uiData.buttons) {
    components.push({
      type: "BUTTONS",
      buttons: uiData.buttons,
    });
  }

  console.log("componentscomponentscomponentscomponents", components);

  return {
    name: uiData.templateName.toLowerCase().replace(/\s+/g, "_"),
    language: uiData.language,
    category: uiData.type.toUpperCase(), // MARKETING
    components,
  };
};
