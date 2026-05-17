package music;

import java.util.ArrayList;
import edu.rutgers.cs112.node.LLNode;

/**
 * This class represents a library of song playlists.
 *
 * An ArrayList of Playlist objects represents the various playlists 
 * within one's library.
 * 
 * @author Jeremy Hui
 * @author Vian Miranda
 */
public class MusicLibrary {

    private ArrayList<Playlist> allPlaylists; // contains various playlists

    /**
     * DO NOT EDIT!
     * Constructor for Library.
     * 
     * @param allPlaylists passes in ArrayList of playlists
     */
    public MusicLibrary(ArrayList<Playlist> allPlaylists) {
        this.allPlaylists = allPlaylists;
    }

    /**
     * DO NOT EDIT!
     * Default constructor for an empty library. 
     */
    public MusicLibrary() {
        this(null);
    }

    /**
     * This method reads the songs from an input csv file, and creates a 
     * playlist from it.
     * Add new songs to the end of the circular linked lists
     * Read the instructions on the website for more detail
     * 
     * @param filename the playlist information input file
     * @return a Playlist object, which contains a reference to the LAST song 
     * in the ciruclar linkedlist playlist and the size of the playlist.
     */
    public Playlist constructPlaylist(String filename) {
        Playlist playlist = new Playlist();
        LLNode<Song> last = null;
        int size = 0;

        StdIn.setFile(filename);
        while (!StdIn.isEmpty()) {
            String[] data = StdIn.readLine().split(",");
            String name = data[0];
            String artist = data[1];
            int year = Integer.parseInt(data[2]);
            int pop = Integer.parseInt(data[3]);
            String link = data[4];

            Song song = new Song(name, artist, year, pop, link);
            LLNode<Song> newNode = new LLNode<Song>(song);

            if (last == null) {
                newNode.setNext(newNode);
            } else {
                newNode.setNext(last.getNext());
                last.setNext(newNode);
            }

            last = newNode;
            size++;
        }

        playlist.setLast(last);
        playlist.setSize(size);
        return playlist;
    }

    /**
     * ****DO NOT**** UPDATE THIS METHOD
     * This method is already implemented for you. 
     * 
     * Adds a new playlist into the song library at a certain index.
     * 
     * @param filename the playlist information input file
     * @param playlistIndex the index of the location where the playlist will 
     * be added 
     */
    public void addPlaylist(String filename, int playlistIndex) {
        
        /* DO NOT UPDATE THIS METHOD */

        if ( allPlaylists == null ) {
            allPlaylists = new ArrayList<Playlist>();
        }
        if ( playlistIndex >= allPlaylists.size() ) {
            allPlaylists.add(constructPlaylist(filename));
        } 
        else if(playlistIndex < 0){
            allPlaylists.add(0, constructPlaylist(filename));
        }
        else {
            allPlaylists.add(playlistIndex, constructPlaylist(filename));
        }        
    }

    /**
     * ****DO NOT**** UPDATE THIS METHOD
     * This method is already implemented for you.
     * 
     * It takes a playlistIndex, and removes the playlist located at that index.
     * 
     * @param playlistIndex the index of the playlist to remove
     * @return true if the playlist has been deleted
     */
    public boolean removePlaylist(int playlistIndex) {
        /* DO NOT UPDATE THIS METHOD */

        if ( allPlaylists == null || playlistIndex >= allPlaylists.size() || playlistIndex < 0) {
            return false;
        }

        allPlaylists.remove(playlistIndex);
            
        return true;
    }
    
    /** 
     * ****DO NOT**** UPDATE THIS METHOD
     * This method is already implemented for you.
     * Adds multiple playlist to different indices based on the provided filenames
     * 
     * @param filenames an array of the filenames of playlists that should be 
     * added to the library
     */
    public void addAllPlaylists(String[] filenames) {
        
        // do not update this method
        allPlaylists = new ArrayList<Playlist>();
        
        for ( int ii = 0; ii < filenames.length; ii++ ) {
            addPlaylist(filenames[ii], ii);
        }
    }

    /**
     * This method adds a song to a specified playlist at a given position.
     * 
     * See the assignment description for full details 
     * 
     * @param playlistIndex the index where the playlist will be added
     * @param position the position in the playlist to which the song 
     * is to be added 
     * @param newSong the song to add
     * @return true if the song can be added and therefore has been added, 
     * false otherwise. 
     */
    public boolean addSong(int playlistIndex, int position, Song newSong) {
        if (!isValidPlaylistIndex(playlistIndex)) {
            return false;
        }

        Playlist playlist = allPlaylists.get(playlistIndex);
        int size = playlist.getSize();
        if (position < 1 || position > size + 1) {
            return false;
        }

        LLNode<Song> newNode = new LLNode<Song>(newSong);

        if (size == 0) {
            newNode.setNext(newNode);
            playlist.setLast(newNode);
        } else if (position == size + 1) {
            newNode.setNext(playlist.getLast().getNext());
            playlist.getLast().setNext(newNode);
            playlist.setLast(newNode);
        } else if (position == 1) {
            newNode.setNext(playlist.getLast().getNext());
            playlist.getLast().setNext(newNode);
        } else {
            LLNode<Song> previous = playlist.getLast().getNext();
            for (int i = 1; i < position - 1; i++) {
                previous = previous.getNext();
            }

            newNode.setNext(previous.getNext());
            previous.setNext(newNode);
        }

        playlist.setSize(size + 1);
        return true;
    }

    /**
     * Find a song in a given playlist given its name
     * @param playlistIndex
     * @param songName
     * @return Song object of song if found, otherwise null
     */
    public Song findSong(int playlistIndex, String songName){
        if (!isValidPlaylistIndex(playlistIndex)) {
            return null;
        }

        Playlist playlist = allPlaylists.get(playlistIndex);
        if (playlist.getLast() == null) {
            return null;
        }

        LLNode<Song> current = playlist.getLast().getNext();
        for (int i = 0; i < playlist.getSize(); i++) {
            if (current.getData().getSongName().equals(songName)) {
                return current.getData();
            }
            current = current.getNext();
        }

        return null;
    }

    /**
     * This method removes a song at a specified playlist, if the song exists. 
     *
     * See the assignment description for full details 
     * 
     * @param playlistIndex the playlist index within the songLibrary where 
     * the song is to be added.
     * @param song the song to remove.
     * @return true if the song is present in the playlist and therefore has 
     * been removed, false otherwise.
     */
    public boolean deleteSong(int playlistIndex, Song song) {
        if (!isValidPlaylistIndex(playlistIndex)) {
            return false;
        }

        Playlist playlist = allPlaylists.get(playlistIndex);
        if (playlist.getLast() == null) {
            return false;
        }

        LLNode<Song> previous = playlist.getLast();
        LLNode<Song> current = playlist.getLast().getNext();

        for (int i = 0; i < playlist.getSize(); i++) {
            if (current.getData().equals(song)) {
                if (playlist.getSize() == 1) {
                    playlist.setLast(null);
                } else {
                    previous.setNext(current.getNext());
                    if (current == playlist.getLast()) {
                        playlist.setLast(previous);
                    }
                }

                playlist.setSize(playlist.getSize() - 1);
                return true;
            }

            previous = current;
            current = current.getNext();
        }

        return false;
    }

    /**
     * This method reverses the playlist located at playlistIndex
     * 
     * Each node in the circular linked list will point to the element that 
     * came before it.
     * 
     * @param playlistIndex the playlist to reverse
     */
    public void reversePlaylist(int playlistIndex) {
        if (!isValidPlaylistIndex(playlistIndex)) {
            return;
        }

        Playlist playlist = allPlaylists.get(playlistIndex);
        if (playlist.getSize() <= 1) {
            return;
        }

        LLNode<Song> oldLast = playlist.getLast();
        LLNode<Song> first = oldLast.getNext();
        LLNode<Song> previous = oldLast;
        LLNode<Song> current = first;

        do {
            LLNode<Song> next = current.getNext();
            current.setNext(previous);
            previous = current;
            current = next;
        } while (current != first);

        playlist.setLast(first);

    }

    /**
     * This method combines two playlists.
     * 
     * See the assignment description on the website for full details on 
     * the procedure for combining the 2 playlists 
     * 
     * @param playlistIndex1 the first playlist to merge into one playlist
     * @param playlistIndex2 the second playlist to merge into one playlist
     */
    public void combinePlaylists(int playlistIndex1, int playlistIndex2) {
        if (!isValidPlaylistIndex(playlistIndex1) || !isValidPlaylistIndex(playlistIndex2)
            || playlistIndex1 == playlistIndex2) {
            return;
        }

        int lowerIndex = Math.min(playlistIndex1, playlistIndex2);
        int higherIndex = Math.max(playlistIndex1, playlistIndex2);

        Playlist lowerPlaylist = allPlaylists.get(lowerIndex);
        Playlist higherPlaylist = allPlaylists.get(higherIndex);
        Playlist combined = new Playlist();

        while (lowerPlaylist.getSize() > 0 && higherPlaylist.getSize() > 0) {
            Song lowerSong = lowerPlaylist.getLast().getNext().getData();
            Song higherSong = higherPlaylist.getLast().getNext().getData();

            if (lowerSong.getPopularity() >= higherSong.getPopularity()) {
                appendNodeToEnd(combined, removeFrontNode(lowerPlaylist));
            } else {
                appendNodeToEnd(combined, removeFrontNode(higherPlaylist));
            }
        }

        while (lowerPlaylist.getSize() > 0) {
            appendNodeToEnd(combined, removeFrontNode(lowerPlaylist));
        }

        while (higherPlaylist.getSize() > 0) {
            appendNodeToEnd(combined, removeFrontNode(higherPlaylist));
        }

        allPlaylists.set(lowerIndex, combined);
        removePlaylist(higherIndex);
      
    }

    /**
     * This method shuffles a specified playlist
     * 
     * See the full procedure for shuffling on the assignment description on the website
     *    
     * @param playlistIndex the playlist to shuffle in songLibrary
     */
    public void shufflePlaylist(int playlistIndex) {
        if (!isValidPlaylistIndex(playlistIndex)) {
            return;
        }

        Playlist playlist = allPlaylists.get(playlistIndex);
        Playlist shuffled = new Playlist();

        while (playlist.getSize() > 0) {
            int randomPosition = StdRandom.uniformInt(1, playlist.getSize() + 1);
            appendNodeToEnd(shuffled, removeNodeAtPosition(playlist, randomPosition));
        }

        playlist.setLast(shuffled.getLast());
        playlist.setSize(shuffled.getSize());

    }

    private boolean isValidPlaylistIndex(int playlistIndex) {
        return allPlaylists != null && playlistIndex >= 0 && playlistIndex < allPlaylists.size();
    }

    private void appendNodeToEnd(Playlist playlist, LLNode<Song> node) {
        if (node == null) {
            return;
        }

        if (playlist.getLast() == null) {
            node.setNext(node);
            playlist.setLast(node);
        } else {
            node.setNext(playlist.getLast().getNext());
            playlist.getLast().setNext(node);
            playlist.setLast(node);
        }

        playlist.setSize(playlist.getSize() + 1);
    }

    private LLNode<Song> removeFrontNode(Playlist playlist) {
        return removeNodeAtPosition(playlist, 1);
    }

    private LLNode<Song> removeNodeAtPosition(Playlist playlist, int position) {
        if (playlist == null || position < 1 || position > playlist.getSize()) {
            return null;
        }

        LLNode<Song> current = playlist.getLast().getNext();
        if (playlist.getSize() == 1) {
            playlist.setLast(null);
            playlist.setSize(0);
            return current;
        }

        LLNode<Song> previous = playlist.getLast();
        for (int i = 1; i < position; i++) {
            previous = current;
            current = current.getNext();
        }

        previous.setNext(current.getNext());
        if (current == playlist.getLast()) {
            playlist.setLast(previous);
        }

        playlist.setSize(playlist.getSize() - 1);
        return current;
    }

    /**
     * ****DO NOT**** UPDATE THIS METHOD
     * Prints playlist by index; can use this method to debug.
     * 
     * @param playlistIndex the playlist to print
     */
    public void printPlaylist(int playlistIndex) {
        StdOut.printf("%nPlaylist at index %d (%d song(s)):%n", playlistIndex, allPlaylists.get(playlistIndex).getSize());
        if (allPlaylists.get(playlistIndex).getLast() == null) {
            StdOut.println("EMPTY");
            return;
        }
        LLNode<Song> ptr;
        for (ptr = allPlaylists.get(playlistIndex).getLast().getNext(); ptr != allPlaylists.get(playlistIndex).getLast(); ptr = ptr.getNext() ) {
            StdOut.print(ptr.getData().toString() + " -> ");
        }
        if (ptr == allPlaylists.get(playlistIndex).getLast()) {
            StdOut.print(allPlaylists.get(playlistIndex).getLast().getData().toString() + " -> POINTS TO FRONT");
        }
        StdOut.println();
    }

    public void printLibrary() {
        if (allPlaylists.size() == 0) {
            StdOut.println("\nYour library is empty!");
        } else {
                for (int ii = 0; ii < allPlaylists.size(); ii++) {
                printPlaylist(ii);
            }
        }
    }

    /*
     * Used to get and set objects.
     * DO NOT edit.
     */
     public ArrayList<Playlist> getPlaylists() { return allPlaylists; }
     public void setPlaylists(ArrayList<Playlist> p) { allPlaylists = p; }
}
