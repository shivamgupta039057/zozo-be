exports.buildTemplatePayload = (uiData) => {
  console.log("uiDatauiDatauiDatauiData", uiData);

  const components = [];

  // HEADER
  if (uiData.headerType === "Media") {
    // header_handle: Resumable Upload handle (e.g. "4:::..."). Either pass media_upload_id (handle) or fileUrl (upload is done in createTemplate).
    const handle = String(uiData.media_upload_id ?? "").trim();
    if (!handle) {
      throw new Error("For Media header provide either media_upload_id (Resumable Upload handle) or fileUrl (image URL; resumable upload will be done automatically).");
    }
    if (/^\d+$/.test(handle)) {
      throw new Error(
        "Invalid media_upload_id: use a Resumable Upload handle (from POST /whatsapp/upload with forTemplate: true) or pass fileUrl in this request so the server can upload for you."
      );
    }
    components.push({
      type: "HEADER",
      format: uiData.mediaType.toUpperCase(), // IMAGE / VIDEO / DOCUMENT
      example: {
        header_handle: [handle],
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

  if (uiData.buttons.legth > 0) {
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
