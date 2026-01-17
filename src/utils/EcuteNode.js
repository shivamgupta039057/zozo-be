// const sendWhatsAppTemplate = require('../services/sendWhatsAppTemplate');

module.exports = async function executeNode(node, lead) {
  console.log("node,leadnode,leadnode,lead" , node, lead);
  console.log("node.data.selectedData.label" , node.data.selectedData.label);
  
  
  if (node.action_type === "Templates") {
    const templateName = node.data.selectedData.label;

    console.log('Preparing to send WhatsApp template with the following data:');
    console.log('Recipient (to):', lead.whatsapp_number);
    console.log('Template Name:', templateName);
    console.log('Variables:', { name: lead.name });
    console.log('Full lead object:', lead);
    console.log('Node object:', node);

    const payload = {
      to: lead.whatsapp_number,
      template_name: templateName,
      variables: {
        name: lead.name
      }
    };

    console.log('Payload to be sent to sendWhatsAppTemplate:', payload);

    // await sendWhatsAppTemplate(payload);

    console.log('WhatsApp template sent successfully');

    return payload;
  }
}
