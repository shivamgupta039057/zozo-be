// const { LeadField } = require("../pgModels/index");

async function insertDefaultLeadFields(LeadField) {
    try {
        if (!LeadField) {
            throw new Error("LeadField model not loaded");
        }


        const count = await LeadField.count();

        if (count === 0) {
            console.log("⏳ Inserting default LeadFields...");

            await LeadField.bulkCreate([
                {
                    name: "name",
                    label: "Name",
                    type: "text",
                    is_required: true,
                    order: 1,
                    is_primary_field: true,
                    icon : "User" ,
                },
                {
                    name: "whatsapp_number",
                    label: "Whatsapp Number",
                    type: "phone",
                    is_required: true,
                    order: 2,
                    is_primary_field: true,
                    icon : "Phone" ,
                },
                {
                    name: "email",
                    label: "Email",
                    type: "email",
                is_required: true,
                    order: 3,
                    is_primary_field: true,
                    icon : "Mail" ,
                },
            ]);

            console.log("✅ Default LeadFields inserted successfully.");
        } else {
            console.log("ℹ️ LeadFields already exist. Skipping...");
        }

    } catch (error) {
        console.error("❌ Error inserting LeadFields:", error);
    }
}

module.exports = insertDefaultLeadFields;
