from setuptools import setup

setup(
    name='haxballgym',
    version='0.0.3',
    install_requires=[
        'gym',
        'numpy',
        ],
    data_files=[
        ('stadiums', ['haxballgym/stadiums/*.hbs']),
    ]
)
