const {sendTemplate} = require("../app/services/whatsappService")

// Extract Templates handler output logic outside the switch/case as a function
async function handleTemplateAction(node,lead) {
  const {whatsapp_number} = lead || {};
  console.log("📲 Sending WhatsApp to hsdkjhfkjhkjdh",);
  await sendTemplate({ phone: `91${whatsapp_number}`, template_name: node.data.selectedData.name,language:node.data.selectedData.language });
  return node.data.selectedData;

 
}

module.exports = async function executeAction(node, lead, newStatus) {

  // console.log("nodenodenodenodenodenode" , node.action_type ,"ddkldkkl" ,node.data);
  // console.log(node.action_type, "actionaaaaaaaaaa");
  switch (node.action_type) {
    // ================== WHATSAPP ==================
    case "Templates": {
      console.log("Templates Templates Templates");
      // Take output from external function
      return handleTemplateAction(node,lead);
    }

    // ================== STATUS UPDATE ==================
    case "Lead Status": {
      console.log("Lead status first")

      const { selectedData } = node.data || {};
      console.log("selectedDataselectedDataselectedData", selectedData)
      const status_id = selectedData?.id;
      if (!status_id) return;

     
        // ❌ Status mismatch → STOP this branch
      if (Number(status_id) !== Number(newStatus)) {
        console.log("⛔ Status mismatch, stopping branch");
        return "__STOP__";
      }

      // ✅ Status matched → allow traversal
      console.log("✅ Status matched, continue workflow");
      return "__CONTINUE__";
      // const OnLeadStatusChange = require("./OnLeadStatusChange");
      // await OnLeadStatusChange(
      //   { ...lead,status_id: status_id },
      //   newStatus
      // );
      // break;
    }

    // ================== DELAY ==================
    case "delay": {
      const { minutes } = node.data || {};
      console.log(`⏳ Delay for ${minutes} minutes`);

      // Here push to BullMQ / Agenda
      break;
    }

    default:
      console.warn("Unknown action:", node.action_type);
  }
};