import dotenv from "dotenv";
import { 
  Client, 
  GatewayIntentBits, 
  ChannelType, 
  EmbedBuilder, 
  Partials, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  PermissionFlagsBits,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder
} from "discord.js";

dotenv.config();

const token = process.env.DISCORD_TOKEN;
const welcomeChannelId = process.env.WELCOME_CHANNEL_ID;
const ticketPanelChannelId = process.env.TICKET_PANEL_CHANNEL_ID;
const ticketCategoryId = process.env.TICKET_CATEGORY_ID;
const archiveCategoryId = process.env.ARCHIVE_CATEGORY_ID;
const staffRoleId = process.env.STAFF_ROLE_ID;
const suggestionsChannelId = process.env.SUGGESTIONS_CHANNEL_ID;

if (!token) {
  console.error("Missing DISCORD_TOKEN in environment");
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds, 
    GatewayIntentBits.GuildMembers, 
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.GuildMember],
});

client.once("clientReady", async () => {
  console.log(`Logged in as ${client.user.tag}`);
  
  // Send test welcome message
  if (welcomeChannelId) {
    try {
      const guild = client.guilds.cache.first();
      if (!guild) {
        console.log("Bot is not in any server yet");
        return;
      }
      
      const channel = guild.channels.cache.get(welcomeChannelId);
      if (!channel) {
        console.log(`Channel ${welcomeChannelId} not found`);
        return;
      }
      
      const testMember = guild.members.me;
      const memberCount = guild.memberCount;
      
      const embed = new EmbedBuilder()
        .setColor(0xFF6B35)
        .setTitle("🦊 ✨ ¡Bienvenid@ a la comunidad! ✨ 🦊")
        .setDescription(`> 🎊 **${testMember}** se ha unido al servidor!\n> ¡Esperamos que disfrutes tu estadía aquí!`)
        .addFields(
          { name: "👤 Usuario", value: `\`${testMember.user.tag}\``, inline: true },
          { name: "📊 Miembro #", value: `\`${memberCount}\``, inline: true },
          { name: "📅 Cuenta creada", value: `<t:${Math.floor(testMember.user.createdTimestamp / 1000)}:R>`, inline: true },
          { name: "\u200B", value: "\u200B", inline: false },
          { name: "🎯 ¿Qué hacer ahora?", value: "• Lee las reglas 📜\n• Preséntate con la comunidad 👋\n• ¡Diviértete y haz amigos! 🎮", inline: false }
        )
        .setThumbnail(testMember.user.displayAvatarURL({ size: 256 }))
        .setImage("https://i.imgur.com/AfFp7pu.png")
        .setFooter({ text: `${guild.name} • ¡Disfruta tu estadía!`, iconURL: guild.iconURL() })
        .setTimestamp();
      
      await channel.send({ 
        content: `🎉 ┃ **¡Un nuevo miembro ha llegado!** ${testMember} 🎊`,
        embeds: [embed] 
      });
      console.log(`✅ Test welcome message sent to ${channel.name}`);
    } catch (error) {
      console.error("Error sending test message:", error);
    }
  }
  
  // Send ticket panel
  if (ticketPanelChannelId) {
    try {
      const guild = client.guilds.cache.first();
      if (!guild) return;
      
      const ticketChannel = guild.channels.cache.get(ticketPanelChannelId);
      if (!ticketChannel) {
        console.log(`Ticket panel channel ${ticketPanelChannelId} not found`);
        return;
      }
      
      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle("🎫 Sistema de Tickets")
        .setDescription(
          "**¿Necesitas ayuda o soporte?**\n\n" +
          "Crea un ticket privado haciendo clic en el botón de abajo.\n" +
          "Podrás seleccionar la categoría de tu problema.\n\n" +
          "📋 **Categorías disponibles:**\n" +
          "🛠️ Soporte Técnico\n" +
          "❓ Preguntas Generales\n" +
          "⚠️ Reportar Problema\n" +
          " Otros\n\n" +
          "📌 **Información importante:**\n" +
          "• Los tickets son privados y solo visibles para ti y el staff\n" +
          "• Describe tu problema claramente\n" +
          "• Sé paciente mientras esperamos respuesta\n" +
          "• No abras múltiples tickets para el mismo problema"
        )
        .setFooter({ text: "Sistema de tickets • FoxFire", iconURL: guild.iconURL() })
        .setTimestamp();
      
      const button = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId("create_ticket")
            .setLabel("📩 Crear Ticket")
            .setStyle(ButtonStyle.Primary)
            .setEmoji("🎫")
        );
      
      await ticketChannel.send({ embeds: [embed], components: [button] });
      console.log(`✅ Ticket panel sent to ${ticketChannel.name}`);
    } catch (error) {
      console.error("Error sending ticket panel:", error);
    }
  }
});

// Handle button interactions
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;
  
  // Create ticket button
  if (interaction.customId === "create_ticket") {
    await interaction.deferReply({ ephemeral: true });
    
    try {
      const guild = interaction.guild;
      const member = interaction.member;
      
      // Check if user already has an open ticket
      const existingTicket = guild.channels.cache.find(
        ch => ch.name === `ticket-${member.user.username.toLowerCase()}` && 
             ch.parentId === ticketCategoryId
      );
      
      if (existingTicket) {
        await interaction.editReply({ 
          content: `❌ Ya tienes un ticket abierto: ${existingTicket}`,
          ephemeral: true 
        });
        return;
      }
      
      // Create ticket channel
      const ticketChannel = await guild.channels.create({
        name: `ticket-${member.user.username}`,
        type: ChannelType.GuildText,
        parent: ticketCategoryId,
        permissionOverwrites: [
          {
            id: guild.id,
            deny: [PermissionFlagsBits.ViewChannel],
          },
          {
            id: member.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory,
            ],
          },
          {
            id: client.user.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory,
            ],
          },
          {
            id: staffRoleId,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory,
            ],
          },
        ],
      });
      
      const ticketEmbed = new EmbedBuilder()
        .setColor(0x57F287)
        .setTitle("🎫 Ticket Creado")
        .setDescription(
          `Hola ${member}, bienvenido a tu ticket.\n\n` +
          "**Por favor, selecciona la categoría de tu ticket en el menú de abajo** y luego describe tu problema con el mayor detalle posible.\n\n" +
          "⏰ **Tiempo de respuesta:** Normalmente entre 1-24 horas\n" +
          "🔒 **Privacidad:** Solo tú y el staff pueden ver este canal"
        )
        .setFooter({ text: `Ticket de ${member.user.tag}`, iconURL: member.user.displayAvatarURL() })
        .setTimestamp();
      
      const categorySelect = new ActionRowBuilder()
        .addComponents(
          new StringSelectMenuBuilder()
            .setCustomId("ticket_category")
            .setPlaceholder("🏷️ Selecciona la categoría del ticket")
            .addOptions(
              new StringSelectMenuOptionBuilder()
                .setLabel("Soporte Técnico")
                .setDescription("Problemas técnicos o errores del servidor")
                .setValue("soporte_tecnico")
                .setEmoji("🛠️"),
              new StringSelectMenuOptionBuilder()
                .setLabel("Preguntas Generales")
                .setDescription("Dudas sobre el funcionamiento del servidor")
                .setValue("preguntas_generales")
                .setEmoji("❓"),
              new StringSelectMenuOptionBuilder()
                .setLabel("Reportar Problema")
                .setDescription("Reportar comportamiento inapropiado o problemas")
                .setValue("reportar_problema")
                .setEmoji("⚠️"),
              new StringSelectMenuOptionBuilder()
                .setLabel("Otros")
                .setDescription("Otro tipo de consulta")
                .setValue("otros")
                .setEmoji("📝")
            )
        );
      
      const archiveButton = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId("archive_ticket")
            .setLabel("Archivar Ticket")
            .setStyle(ButtonStyle.Danger)
            .setEmoji("🗃️")
        );
      
      await ticketChannel.send({ 
        content: `${member} | <@&${staffRoleId}>`,
        embeds: [ticketEmbed], 
        components: [categorySelect, archiveButton] 
      });
      
      await interaction.editReply({ 
        content: `✅ Ticket creado exitosamente: ${ticketChannel}`,
        ephemeral: true 
      });
      
    } catch (error) {
      console.error("Error creating ticket:", error);
      await interaction.editReply({ 
        content: "❌ Hubo un error al crear el ticket. Contacta con un administrador.",
        ephemeral: true 
      });
    }
  }
  
  // Archive ticket button
  if (interaction.customId === "archive_ticket") {
    await interaction.deferReply({ ephemeral: true });
    
    try {
      const channel = interaction.channel;
      
      if (!channel.name.startsWith("ticket-")) {
        await interaction.editReply({ 
          content: "❌ Este comando solo funciona en canales de tickets.",
          ephemeral: true 
        });
        return;
      }
      
      // Move to archive category
      await channel.setParent(archiveCategoryId);
      await channel.setName(`archived-${channel.name}`);
      
      // Lock the channel
      await channel.permissionOverwrites.edit(interaction.guild.id, {
        SendMessages: false,
      });
      
      const archiveEmbed = new EmbedBuilder()
        .setColor(0x95A5A6)
        .setTitle("🗃️ Ticket Archivado")
        .setDescription(
          `Este ticket ha sido archivado por ${interaction.user}.\n\n` +
          "El canal permanecerá visible pero no se podrán enviar más mensajes.\n" +
          "Si necesitas reabrir el ticket, contacta con un administrador."
        )
        .setTimestamp();
      
      await channel.send({ embeds: [archiveEmbed] });
      
      await interaction.editReply({ 
        content: "✅ Ticket archivado correctamente.",
        ephemeral: true 
      });
      
    } catch (error) {
      console.error("Error archiving ticket:", error);
      await interaction.editReply({ 
        content: "❌ Hubo un error al archivar el ticket.",
        ephemeral: true 
      });
    }
  }
  
  // Handle category selection
  if (interaction.isStringSelectMenu() && interaction.customId === "ticket_category") {
    const category = interaction.values[0];
    
    const categoryNames = {
      soporte_tecnico: "🛠️ Soporte Técnico",
      preguntas_generales: "❓ Preguntas Generales",
      reportar_problema: "⚠️ Reportar Problema",
      otros: "📝 Otros"
    };
    
    const categoryEmbed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle("🏷️ Categoría Seleccionada")
      .setDescription(`**Categoría del ticket:** ${categoryNames[category]}\n\nAhora puedes explicar tu problema o pregunta con detalle.`)
      .setTimestamp();
    
    await interaction.reply({ embeds: [categoryEmbed] });
    
    // Update channel name with category
    const categoryPrefix = {
      soporte_tecnico: "tech",
      preguntas_generales: "question",
      reportar_problema: "report",
      otros: "other"
    };
    
    try {
      await interaction.channel.setName(
        `${categoryPrefix[category]}-${interaction.channel.name.replace(/^ticket-/, "")}`
      );
    } catch (error) {
      console.error("Error updating channel name:", error);
    }
  }
});

// Auto-react to suggestions
client.on("messageCreate", async (message) => {
  // Ignore bot messages
  if (message.author.bot) return;
  
  // Check if message is in suggestions channel
  if (message.channel.id === suggestionsChannelId) {
    try {
      await message.react("👍");
      await message.react("👎");
    } catch (error) {
      console.error("Error adding reactions to suggestion:", error);
    }
  }
});

client.on("guildMemberAdd", async (member) => {
  try {
    if (!welcomeChannelId) {
      console.warn("WELCOME_CHANNEL_ID not configured");
      return;
    }
    
    const channel = member.guild.channels.cache.get(welcomeChannelId);
    if (!channel) {
      console.warn(`Welcome channel ${welcomeChannelId} not found in guild ${member.guild.id}`);
      return;
    }

    const memberCount = member.guild.memberCount;

    const embed = new EmbedBuilder()
      .setColor(0xFF6B35)
      .setTitle("🦊 ✨ ¡Bienvenid@ a la comunidad! ✨ 🦊")
      .setDescription(`> 🎊 **${member}** se ha unido al servidor!\n> ¡Esperamos que disfrutes tu estadía aquí!`)
      .addFields(
        { name: "👤 Usuario", value: `\`${member.user.tag}\``, inline: true },
        { name: "📊 Miembro #", value: `\`${memberCount}\``, inline: true },
        { name: "📅 Cuenta creada", value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
        { name: "\u200B", value: "\u200B", inline: false },
        { name: "🎯 ¿Qué hacer ahora?", value: "• Lee las reglas 📜\n• Preséntate con la comunidad 👋\n• ¡Diviértete y haz amigos! 🎮", inline: false }
      )
      .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
      .setImage("https://i.imgur.com/AfFp7pu.png")
      .setFooter({ text: `${member.guild.name} • ¡Disfruta tu estadía!`, iconURL: member.guild.iconURL() })
      .setTimestamp();

    await channel.send({ 
      content: `🎉 ┃ **¡Un nuevo miembro ha llegado!** ${member} 🎊`,
      embeds: [embed] 
    });
  } catch (error) {
    console.error("Error sending welcome message", error);
  }
});

client.login(token);
