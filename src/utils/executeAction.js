const OnLeadStatusChange = require("./OnLeadStatusChange");
// const sendWhatsAppMessage = require("../services/whatsapp");

// Extract Templates handler output logic outside the switch/case as a function
function handleTemplateAction(node) {
  const { template_id, variables } = node.data || {};
  // console.log("fffnodenodenodenodenodenodenodenode", node);

  console.log("📲 Sending WhatsApp to hsdkjhfkjhkjdh", node.data.selectedData.label);
  return node.data.selectedData.label;

  // await sendWhatsAppMessage({ template_id, variables, lead });
}

module.exports = async function executeAction(node, lead) {
  // console.log(node.action_type, "actionaaaaaaaaaa");
  switch (node.action_type) {
    // ================== WHATSAPP ==================
    case "Templates": {
      // Take output from external function
      return handleTemplateAction(node);
    }

    // ================== STATUS UPDATE ==================
    case "Lead Status": {
      console.log("Lead status first")

      const { status_id } = node.data || {};
      if (!status_id) return;

      console.log("🔄 Updating lead status to", status_id);

      // await Lead.update({ status_id }, { where: { id: lead.id } });

      await OnLeadStatusChange(
        { ...lead, status_id },
        status_id
      );
      break;
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