#!/usr/bin/env python3
"""
One2lv Control Plane Compilers v1.0
Setup script for package installation
"""

from setuptools import setup, find_packages
import os

# Read version from source
try:
    with open('src/__init__.py') as f:
        for line in f:
            if line.startswith('__version__'):
                version = line.split('=')[1].strip().strip('"\'')
                break
except:
    version = "1.0.0"

# Read long description
try:
    with open('README.md') as f:
        long_description = f.read()
except:
    long_description = "Control Plane Compiler v1.0 - Graph-Compiled Agency Runtime"

setup(
    name="one2lv-control-plane-compilers",
    version=version,
    description="Control Plane Compiler v1.0 - Graph-Compiled Agency Runtime",
    long_description=long_description,
    long_description_content_type="text/markdown",
    author="One2lv Systems",
    author_email="dev@one2lv.io",
    maintainer="One2lv Systems",
    maintainer_email="dev@one2lv.io",
    url="https://github.com/one2lv-com/control-plane-compilers",
    license="MIT",
    packages=find_packages(where="src"),
    package_dir={"": "src"},
    python_requires=">=3.8",
    install_requires=[
        "numpy>=1.21.0",
        "typing-extensions>=4.0.0",
    ],
    extras_require={
        "dev": [
            "pytest>=7.0.0",
            "black>=22.0.0",
            "mypy>=0.900",
            "sphinx>=4.0.0",
        ],
    },
    classifiers=[
        "Development Status :: 5 - Production/Stable",
        "Intended Audience :: Developers",
        "Intended Audience :: Science/Research",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Topic :: Software Development :: Compilers",
        "Topic :: Scientific/Engineering :: Artificial Intelligence",
    ],
    keywords="control plane compiler agency runtime distributed",
    project_urls={
        "Bug Reports": "https://github.com/one2lv-com/control-plane-compilers/issues",
        "Source": "https://github.com/one2lv-com/control-plane-compilers",
    },
    include_package_data=True,
    zip_safe=False,
)

