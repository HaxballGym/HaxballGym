from setuptools import setup

setup(
    name='haxballgym',
    version='0.1.0',
    install_requires=[
        'gym',
        'numpy',
        'msgpack',
        ],
    data_files=[
        ('stadiums', ['haxballgym/stadiums/*.hbs']),
    ]
)
