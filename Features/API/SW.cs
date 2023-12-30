﻿using Rozhok.Features.Configs;
using Rozhok.Features.Configs.Classes;
using System.Text.RegularExpressions;
using Discord.WebSocket;
using Discord;

namespace Rozhok.API;

public static class SaveAndWrite
{
    public static Dictionary<ulong, List<string>> SavedData { get; set; } = new();

    public static Random Random = new Random();
    public static bool TrySaveData(SocketMessage data)
    {
        if (!ConfigsLoader.Config.SaveDataSettings.SaveAnyData) return false;

        if (ConfigsLoader.Config.SaveDataSettings.ImagesSaveAndUse
        && data.Attachments.Count < ConfigsLoader.Config.SaveDataSettings.LimitImagesToOnce)
        {
            foreach (Attachment? attachment in data.Attachments)
            {
                if (!attachment.Filename.EndsWith(".jpg")
                    && !attachment.Filename.EndsWith(".jpeg")
                    && !attachment.Filename.EndsWith(".png")) continue;

                Extensions.DownloadAndSaveFile(attachment.Url, data, attachment.Filename);
            }
        }

        if (data.Content == null) return false;

        if (ConfigsLoader.Config.SaveDataSettings.MessageFilterType == MessageFilter.Links
            && Regex.IsMatch(data.Content, @"(https?://)?(www.)?(discord.(gg|io|me|li)|discordapp.com/invite)/[^\s/]+?(?=\s)")) return false;

        if (data.Content.Length > ConfigsLoader.Config.SaveDataSettings.MaxLenghtToWrite) return false;

        if (data.Content == $"<@{Bot.Client?.CurrentUser.Id}>") return false;

        ulong guildid = (data.Channel as SocketGuildChannel)!.Guild.Id;
        if (ConfigsLoader.Config.SaveDataSettings.OurFile) guildid = 0;

        if (!SavedData.ContainsKey(guildid))
        {
            LoadData(guildid);
        }
        else SavedData[guildid].Add(data.Content);

        return true;
    }
    public static void LoadData(ulong id)
    {
        if (!Directory.Exists(ConfigsLoader.DataDirectory)) Directory.CreateDirectory(ConfigsLoader.DataDirectory);

        Console.WriteLine($"Начинаем подгрузку данных гильдии.. ({id} / 0 - общий файл)");

        if (!File.Exists(ConfigsLoader.GetPath(Path.Combine("Data", "data.txt"))))
            File.WriteAllText(ConfigsLoader.GetPath(Path.Combine("Data", "data.txt")), "привет");

        string txt = "";

        if (ConfigsLoader.Config.SaveDataSettings.OurFile || id == 0)
        {
            if (File.Exists(ConfigsLoader.GetPath(Path.Combine("Data", "data.txt"))))
            {
                txt = File.ReadAllText(ConfigsLoader.GetPath(Path.Combine("Data", "data.txt")));
            }
        }
        else
        {

            if (File.Exists(ConfigsLoader.GetPath(Path.Combine("Data", $"{id}_data.txt"))))
            {
                txt = File.ReadAllText(ConfigsLoader.GetPath(Path.Combine("Data", $"{id}_data.txt")));
            }
        }

        List<string> list = txt.Split('\n').ToList();

        // На подстраховачку (сигма сигма сигма)
        if (!SavedData.ContainsKey(id))
        {
            SavedData.Add(id, list);
        }
        else SavedData[id] = list;
    }
    public static void WriteData()
    {
        if (!Directory.Exists(ConfigsLoader.DataDirectory)) Directory.CreateDirectory(ConfigsLoader.DataDirectory);

        string path = "";

        if (ConfigsLoader.Config.SaveDataSettings.OurFile)
        {
            path = ConfigsLoader.GetPath(Path.Combine("Data", "data.txt"));

            string data = string.Join('\n', SavedData.Select(x => x.Value));

            File.WriteAllText(path, data);

            return;
        }

        foreach (KeyValuePair<ulong, List<string>> data in SavedData)
        {
            path = ConfigsLoader.GetPath(Path.Combine("Data", $"{data.Key}_data.txt"));

            File.WriteAllText(path, string.Join('\n', data.Value));
        }

        Console.WriteLine("Данные сохранены.");
    }
    public static void GetRandomMessage(SocketMessage data)
    {
        if (Random.Next(0, 10) < 2 && ConfigsLoader.Config.SaveDataSettings.ImagesSaveAndUse)
        {
            string[] files = Directory.GetFiles(ConfigsLoader.ImageDirectory);

            if (files.Count() > 0)
            {
                (data.Channel as ITextChannel)?.SendFileAsync(files[Random.Next(0, files.Length)]);

                return;
            }
        }

        ulong guildid = (data.Channel as SocketGuildChannel)!.Guild.Id;

        string randommessage1 = SavedData[guildid][Random.Next(0, SavedData[guildid].Count)];
        string randommessage2 = SavedData[guildid][Random.Next(0, SavedData[guildid].Count)];

        if (Random.Next(0, 10) < 7) (data.Channel as ITextChannel)?.SendMessageAsync(randommessage1);
        else (data.Channel as ITextChannel)?.SendMessageAsync($"{randommessage1} {randommessage2}");
    }
    public static void FilterFile()
    {
        foreach (string file in Directory.GetFiles(ConfigsLoader.GetPath(Path.Combine("Data"))))
        {
            string[] lines = File.ReadAllLines(file);

            List<string> FilteredList = new List<string>();
            foreach (string? line in lines.ToList())
            {
                if (line != string.Empty) FilteredList.Add(line);
            }

            File.WriteAllText(file, string.Join('\n', FilteredList));
        }

        Console.WriteLine("Очистка успешна!");
    }
}
