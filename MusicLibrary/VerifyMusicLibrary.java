import music.MusicLibrary;
import music.Playlist;
import music.Song;
import music.StdRandom;
import edu.rutgers.cs112.node.LLNode;

public class VerifyMusicLibrary {
    private static void assertTrue(boolean condition, String message) {
        if (!condition) {
            throw new RuntimeException(message);
        }
    }

    private static Song songAt(Playlist playlist, int position) {
        LLNode<Song> current = playlist.getLast().getNext();
        for (int i = 1; i < position; i++) {
            current = current.getNext();
        }
        return current.getData();
    }

    public static void main(String[] args) {
        MusicLibrary library = new MusicLibrary();

        Playlist constructed = library.constructPlaylist("2010.csv");
        assertTrue(constructed.getSize() == 8, "constructPlaylist size");
        assertTrue(songAt(constructed, 1).getSongName().equals("Hey Soul Sister"), "constructPlaylist first");
        assertTrue(songAt(constructed, 8).getSongName().equals("Empire State of Mind (Part II) Broken Down"), "constructPlaylist last");
        assertTrue(constructed.getLast().getNext().getData().getSongName().equals("Hey Soul Sister"), "constructPlaylist circular");

        library.addPlaylist("2010.csv", 0);
        assertTrue(library.addSong(0, 3, new Song("Test Song", "Test Artist", 2026, 80)), "addSong return");
        assertTrue(library.getPlaylists().get(0).getSize() == 9, "addSong size");
        assertTrue(songAt(library.getPlaylists().get(0), 3).getSongName().equals("Test Song"), "addSong position");
        assertTrue(!library.addSong(0, 11, new Song("Bad", "Input", 2026, 1)), "addSong invalid position");

        Song found = library.findSong(0, "Test Song");
        assertTrue(found != null && found.getArtist().equals("Test Artist"), "findSong hit");
        assertTrue(library.findSong(0, "Missing Song") == null, "findSong miss");

        assertTrue(library.deleteSong(0, new Song("Test Song", "Test Artist", 2026, 80)), "deleteSong return");
        assertTrue(library.getPlaylists().get(0).getSize() == 8, "deleteSong size");
        assertTrue(library.findSong(0, "Test Song") == null, "deleteSong removed");

        library.reversePlaylist(0);
        assertTrue(songAt(library.getPlaylists().get(0), 1).getSongName().equals("Empire State of Mind (Part II) Broken Down"), "reversePlaylist front");
        assertTrue(library.getPlaylists().get(0).getLast().getData().getSongName().equals("Hey Soul Sister"), "reversePlaylist last");

        library = new MusicLibrary();
        library.addAllPlaylists(new String[] {"2010.csv", "2011.csv"});
        library.combinePlaylists(0, 1);
        assertTrue(library.getPlaylists().size() == 1, "combinePlaylists library size");
        assertTrue(library.getPlaylists().get(0).getSize() == 18, "combinePlaylists playlist size");
        assertTrue(songAt(library.getPlaylists().get(0), 1).getSongName().equals("Hey Soul Sister"), "combinePlaylists first");
        assertTrue(songAt(library.getPlaylists().get(0), 2).getSongName().equals("Love The Way You Lie"), "combinePlaylists second");
        assertTrue(songAt(library.getPlaylists().get(0), 3).getSongName().equals("A Thousand Years"), "combinePlaylists third");

        library = new MusicLibrary();
        library.addPlaylist("2010.csv", 0);
        StdRandom.setSeed(2026);
        library.shufflePlaylist(0);
        assertTrue(library.getPlaylists().get(0).getSize() == 8, "shufflePlaylist size");
        assertTrue(library.findSong(0, "Hey Soul Sister") != null, "shufflePlaylist keeps songs");
        assertTrue(library.findSong(0, "Empire State of Mind (Part II) Broken Down") != null, "shufflePlaylist keeps songs 2");

        System.out.println("verification passed");
    }
}
