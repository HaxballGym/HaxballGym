__version__ = '0.2.1'

release_notes = {
    '0.2.1': """
    Fix setup error that made it so we didn't import the stadiums.
    """,
    '0.2.0': """
    Alpha release
    """,
    '0.1.0': """
    Initial Release
    """
}


def get_current_release_notes():
    if __version__ in release_notes:
        return release_notes[__version__]
    return ''


def print_current_release_notes():
    print(f"Version {__version__}")
    print(get_current_release_notes())
    print("")